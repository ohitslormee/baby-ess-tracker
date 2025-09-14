from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import aiohttp
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Utility functions for datetime handling
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key in ['created_at', 'updated_at', 'last_used']:
                try:
                    item[key] = datetime.fromisoformat(value)
                except ValueError:
                    pass
    return item

# Define Models
class InventoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    barcode: str
    name: str
    category: str = "Other"
    current_stock: int = 0
    min_stock_alert: int = 5
    unit_type: str = "pieces"  # pieces, bottles, packs, etc.
    brand: Optional[str] = None
    size: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_used: Optional[datetime] = None

class InventoryItemCreate(BaseModel):
    barcode: str
    name: str
    category: str = "Other"
    current_stock: int = 0
    min_stock_alert: int = 5
    unit_type: str = "pieces"
    brand: Optional[str] = None
    size: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_stock: Optional[int] = None
    min_stock_alert: Optional[int] = None
    unit_type: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None

class UsageLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    barcode: str
    quantity_used: int = 1
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

class UsageLogCreate(BaseModel):
    item_id: str
    barcode: str
    quantity_used: int = 1
    notes: Optional[str] = None

class Child(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    date_of_birth: str  # Using string for date to avoid serialization issues
    gender: Optional[str] = None
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChildCreate(BaseModel):
    name: str
    date_of_birth: str
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    notes: Optional[str] = None

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    notes: Optional[str] = None

class ProductLookupResponse(BaseModel):
    found: bool
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None

# Product lookup functions
async def lookup_product_openfoodfacts(barcode: str) -> ProductLookupResponse:
    """Lookup product information from Open Food Facts API"""
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('status') == 1 and 'product' in data:
                        product = data['product']
                        return ProductLookupResponse(
                            found=True,
                            product_name=product.get('product_name', ''),
                            brand=product.get('brands', ''),
                            category=classify_baby_category(product.get('categories', '')),
                            size=product.get('quantity', '')
                        )
    except Exception as e:
        logging.error(f"OpenFoodFacts lookup error: {e}")
    
    return ProductLookupResponse(found=False)

async def lookup_product_upc(barcode: str) -> ProductLookupResponse:
    """Fallback lookup using UPC database (you would need an API key for a real service)"""
    # This is a placeholder - in a real implementation you'd use services like:
    # - UPC Database API
    # - Barcode Spider API
    # - etc.
    return ProductLookupResponse(found=False)

def classify_baby_category(categories_str: str) -> str:
    """Classify product into baby-related categories based on category string"""
    categories_lower = categories_str.lower()
    
    if any(word in categories_lower for word in ['diaper', 'nappy', 'pampers']):
        return 'Diapers'
    elif any(word in categories_lower for word in ['wipe', 'wet wipe', 'baby wipe']):
        return 'Wet Wipes'
    elif any(word in categories_lower for word in ['formula', 'milk', 'baby food', 'infant']):
        return 'Food & Formula'
    elif any(word in categories_lower for word in ['lotion', 'cream', 'shampoo', 'soap']):
        return 'Bath & Care'
    elif any(word in categories_lower for word in ['medicine', 'vitamin', 'supplement']):
        return 'Medicine & Health'
    else:
        return 'Other'

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Baby ERP API"}

@api_router.post("/products/lookup/{barcode}", response_model=ProductLookupResponse)
async def lookup_product(barcode: str):
    """Lookup product information by barcode"""
    # Try Open Food Facts first
    result = await lookup_product_openfoodfacts(barcode)
    
    # If not found, try other services
    if not result.found:
        result = await lookup_product_upc(barcode)
    
    return result

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item: InventoryItemCreate):
    """Create a new inventory item"""
    # Check if item with this barcode already exists
    existing = await db.inventory.find_one({"barcode": item.barcode})
    if existing:
        raise HTTPException(status_code=400, detail="Item with this barcode already exists")
    
    item_dict = item.dict()
    inventory_item = InventoryItem(**item_dict)
    
    # Prepare for MongoDB storage
    item_to_store = prepare_for_mongo(inventory_item.dict())
    await db.inventory.insert_one(item_to_store)
    
    return inventory_item

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory():
    """Get all inventory items"""
    items = await db.inventory.find().to_list(1000)
    return [InventoryItem(**parse_from_mongo(item)) for item in items]

@api_router.get("/inventory/low-stock")
async def get_low_stock_items():
    """Get items that are below their minimum stock alert level"""
    # Using a simple approach since $expr might not be supported in older MongoDB versions
    all_items = await db.inventory.find().to_list(1000)
    low_stock_items = []
    
    for item in all_items:
        if item.get('current_stock', 0) <= item.get('min_stock_alert', 5):
            low_stock_items.append(item)
    
    return [InventoryItem(**parse_from_mongo(item)) for item in low_stock_items]

@api_router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: str):
    """Get a specific inventory item"""
    item = await db.inventory.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return InventoryItem(**parse_from_mongo(item))

@api_router.get("/inventory/barcode/{barcode}", response_model=InventoryItem)
async def get_inventory_by_barcode(barcode: str):
    """Get inventory item by barcode"""
    item = await db.inventory.find_one({"barcode": barcode})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return InventoryItem(**parse_from_mongo(item))

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, update_data: InventoryItemUpdate):
    """Update an inventory item"""
    # Get existing item
    existing_item = await db.inventory.find_one({"id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update fields
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc)
    
    # Prepare for MongoDB
    update_dict = prepare_for_mongo(update_dict)
    
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )
    
    # Return updated item
    updated_item = await db.inventory.find_one({"id": item_id})
    return InventoryItem(**parse_from_mongo(updated_item))

@api_router.post("/inventory/{item_id}/add-stock")
async def add_stock(item_id: str, quantity: int):
    """Add stock to an inventory item"""
    item = await db.inventory.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    new_stock = item['current_stock'] + quantity
    update_data = {
        'current_stock': new_stock,
        'updated_at': datetime.now(timezone.utc)
    }
    
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": prepare_for_mongo(update_data)}
    )
    
    return {"message": f"Added {quantity} units. New stock: {new_stock}"}

@api_router.post("/inventory/{item_id}/use", response_model=UsageLog)
async def use_item(item_id: str, usage_data: UsageLogCreate):
    """Record usage of an inventory item"""
    item = await db.inventory.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item['current_stock'] < usage_data.quantity_used:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Create usage log
    usage_log = UsageLog(**usage_data.dict())
    await db.usage_logs.insert_one(prepare_for_mongo(usage_log.dict()))
    
    # Update inventory stock
    new_stock = item['current_stock'] - usage_data.quantity_used
    update_data = {
        'current_stock': new_stock,
        'updated_at': datetime.now(timezone.utc),
        'last_used': datetime.now(timezone.utc)
    }
    
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": prepare_for_mongo(update_data)}
    )
    
    return usage_log

@api_router.get("/usage-logs", response_model=List[UsageLog])
async def get_usage_logs(limit: int = 100):
    """Get usage logs"""
    logs = await db.usage_logs.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [UsageLog(**parse_from_mongo(log)) for log in logs]

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    total_items = await db.inventory.count_documents({})
    # Use simple count instead of $expr for compatibility
    all_items = await db.inventory.find().to_list(1000)
    low_stock_count = len([item for item in all_items if item.get('current_stock', 0) <= item.get('min_stock_alert', 5)])
    out_of_stock_count = await db.inventory.count_documents({"current_stock": 0})
    
    return {
        "total_items": total_items,
        "low_stock_items": low_stock_count,
        "out_of_stock_items": out_of_stock_count
    }

# Children management endpoints
@api_router.post("/children", response_model=Child)
async def create_child(child: ChildCreate):
    """Create a new child record"""
    child_dict = child.dict()
    child_obj = Child(**child_dict)
    
    # Prepare for MongoDB storage
    child_to_store = prepare_for_mongo(child_obj.dict())
    await db.children.insert_one(child_to_store)
    
    return child_obj

@api_router.get("/children", response_model=List[Child])
async def get_children():
    """Get all children records"""
    children = await db.children.find().to_list(100)
    return [Child(**parse_from_mongo(child)) for child in children]

@api_router.get("/children/{child_id}", response_model=Child)
async def get_child(child_id: str):
    """Get a specific child record"""
    child = await db.children.find_one({"id": child_id})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return Child(**parse_from_mongo(child))

@api_router.put("/children/{child_id}", response_model=Child)
async def update_child(child_id: str, update_data: ChildUpdate):
    """Update a child record"""
    # Get existing child
    existing_child = await db.children.find_one({"id": child_id})
    if not existing_child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Update fields
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc)
    
    # Prepare for MongoDB
    update_dict = prepare_for_mongo(update_dict)
    
    await db.children.update_one(
        {"id": child_id},
        {"$set": update_dict}
    )
    
    # Return updated child
    updated_child = await db.children.find_one({"id": child_id})
    return Child(**parse_from_mongo(updated_child))

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str):
    """Delete a child record"""
    result = await db.children.delete_one({"id": child_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"message": "Child deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()