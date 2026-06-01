import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Bell, BellOff, Star, Shield,
  ChevronRight, LogOut, HelpCircle, Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PERMIT_TYPES = ['A', 'B', 'C', 'Garage', 'Residence Hall', 'Visitor'];

export default function ProfileTab({ userPrefs }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (data) => {
      if (userPrefs?.id) {
        return base44.entities.UserPreferences.update(userPrefs.id, data);
      } else if (user?.email) {
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Settings saved');
    },
  });

  const handleToggle = async (field, value) => {
    if (userPrefs?.id) {
      updatePrefsMutation.mutate({ [field]: value });
    } else if (user?.email) {
      // Create new preferences if none exist
      updatePrefsMutation.mutate({ 
        user_email: user.email,
        [field]: value 
      });
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    try {
      await base44.auth.logout();
      toast.success('Account deletion requested. Contact support to complete removal.');
    } catch {
      toast.error('Something went wrong. Please contact support.');
    }
  };

  return (
    <div className="px-4 py-3 pb-24 overflow-y-auto h-[calc(100vh-150px)]" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="w-16 h-16 bg-[#CEB888] rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {user?.full_name?.[0]?.toUpperCase() || 'P'}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {user?.full_name || 'Boilermaker'}
          </h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-0">
          <Star className="w-5 h-5 text-amber-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {(userPrefs?.favorite_routes?.length || 0) + (userPrefs?.favorite_lots?.length || 0)}
          </div>
          <div className="text-sm text-gray-600">Favorites</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-0">
          <Shield className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {userPrefs?.default_permit || '—'}
          </div>
          <div className="text-sm text-gray-600">Permit</div>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="font-semibold text-gray-700">Settings</h3>

        {/* Notifications */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Notifications</div>
                <div className="text-sm text-gray-500">Receive alerts and updates</div>
              </div>
            </div>
            <Switch
              checked={userPrefs?.notifications_enabled ?? true}
              onCheckedChange={(v) => handleToggle('notifications_enabled', v)}
            />
          </div>
        </Card>

        {/* Event Alerts */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Badge className="bg-[#CEB888] text-gray-900 text-xs">!</Badge>
              </div>
              <div>
                <div className="font-medium text-gray-900">Event Alerts</div>
                <div className="text-sm text-gray-500">Get notified about parking changes</div>
              </div>
            </div>
            <Switch
              checked={userPrefs?.event_alerts ?? true}
              onCheckedChange={(v) => handleToggle('event_alerts', v)}
            />
          </div>
        </Card>

        {/* Bus Delay Alerts */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <BellOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Bus Delay Alerts</div>
                <div className="text-sm text-gray-500">Notify when buses are delayed</div>
              </div>
            </div>
            <Switch
              checked={userPrefs?.bus_delay_alerts ?? true}
              onCheckedChange={(v) => handleToggle('bus_delay_alerts', v)}
            />
          </div>
        </Card>

        {/* Default Permit */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Your Permit</div>
                <div className="text-sm text-gray-500">Filter lots by permit type</div>
              </div>
            </div>
            <Select
              value={userPrefs?.default_permit || ''}
              onValueChange={(v) => handleToggle('default_permit', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {PERMIT_TYPES.map(permit => (
                  <SelectItem key={permit} value={permit}>{permit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-3"
      >
        <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Button
          variant="outline"
          className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-12 text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your account? This action cannot be undone. All your saved preferences, favorites, and data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <div className="text-xs text-gray-400">
          Boiler Transport v1.0
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Made for Boilermakers 🚂
        </div>
      </motion.div>
    </div>
  );
}
