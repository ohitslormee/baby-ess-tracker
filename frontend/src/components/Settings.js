import React from 'react';
import { Settings as SettingsIcon, Palette, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme, colors } = useTheme();

  const themeDisplayName = theme === 'baby-blue' ? 'Baby Blue' : 'Baby Girl';
  const themeIcon = theme === 'baby-blue' ? Sun : Moon;
  const ThemeIcon = themeIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 text-lg">Customize your Caelestis experience</p>
        </div>

        {/* Theme Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Settings
            </CardTitle>
            <CardDescription>Choose your preferred color theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Current Theme</h3>
                <p className="text-sm text-gray-600">Switch between baby blue and baby girl themes</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={colors.accent}>
                  <ThemeIcon className="h-4 w-4 mr-1" />
                  {themeDisplayName}
                </Badge>
                <Button
                  onClick={toggleTheme}
                  className={`${colors.button} text-white transition-colors`}
                >
                  Switch Theme
                </Button>
              </div>
            </div>

            {/* Theme Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded"></div>
                  <span className="font-medium text-blue-800">Baby Blue Theme</span>
                </div>
                <p className="text-sm text-blue-600">Calming blue tones perfect for a peaceful nursery</p>
                {theme === 'baby-blue' && (
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Current</Badge>
                )}
              </div>

              <div className="p-4 border-2 rounded-lg bg-pink-50 border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-400 to-rose-500 rounded"></div>
                  <span className="font-medium text-pink-800">Baby Pink Theme</span>
                </div>
                <p className="text-sm text-pink-600">Warm pink tones creating a cozy atmosphere</p>
                {theme === 'baby-pink' && (
                  <Badge className="mt-2 bg-pink-100 text-pink-800">Current</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              App Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">App Name</span>
                <span className="font-medium">Caelestis</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Theme</span>
                <Badge className={colors.accent}>{themeDisplayName}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;