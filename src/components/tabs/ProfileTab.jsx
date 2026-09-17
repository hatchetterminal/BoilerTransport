import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  Shield,
  SlidersHorizontal,
  Star,
  Trash2,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { APP_CONFIG } from '@/lib/app-config';

const PERMIT_TYPES = ['A', 'B', 'C', 'Student Garage', 'Residence Hall', 'Visitor/Paid', 'Value'];

export default function ProfileTab({
  preferences,
  isSavingPreferences,
  updatePreferences,
  removePreferences,
}) {
  const handleRemoveData = async () => {
    try {
      await removePreferences();
    } catch {
      toast.error('Saved app data could not be removed');
    }
  };

  return (
    <div
      className="px-4 py-3 pb-24 overflow-y-auto h-[calc(100vh-150px)]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div
          className="w-16 h-16 bg-[#CEB888] rounded-2xl flex items-center justify-center"
          aria-hidden="true"
        >
          <SlidersHorizontal className="w-7 h-7 text-neutral-900" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Preferences</h2>
          <p className="text-sm text-muted-foreground">Saved only on this device</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <Card className="p-4 bg-gradient-to-br from-amber-50 dark:from-amber-950/50 to-amber-100 dark:to-amber-950/50 border-0">
          <Star className="w-5 h-5 text-amber-600 dark:text-amber-300 mb-2" aria-hidden="true" />
          <div className="text-2xl font-bold text-foreground">
            {(preferences.favorite_routes?.length || 0) + (preferences.favorite_lots?.length || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Favorites</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 dark:from-blue-950/50 to-blue-100 dark:to-blue-950/50 border-0">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-300 mb-2" aria-hidden="true" />
          <div className="text-2xl font-bold text-foreground">
            {preferences.default_permit || '—'}
          </div>
          <div className="text-sm text-muted-foreground">Permit</div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="font-semibold text-foreground">Settings</h3>

        <Card className="p-4">
          <h4 className="font-medium text-foreground" id="appearance-label">
            Appearance
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a comfortable background. Status icons adjust automatically.
          </p>
          <div
            className="grid grid-cols-3 gap-2 mt-4"
            role="group"
            aria-labelledby="appearance-label"
          >
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'Follow Device', icon: Smartphone },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                disabled={isSavingPreferences}
                aria-pressed={preferences.appearance === value}
                onClick={() => updatePreferences({ appearance: value }, 'Appearance saved')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-medium min-h-20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  preferences.appearance === value
                    ? 'border-[#CEB888] bg-[#CEB888]/15 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </Card>

        <SettingToggle
          icon={Bell}
          iconClassName="bg-muted text-muted-foreground"
          title="Notifications"
          description="Show in-app alerts and updates"
          checked={preferences.notifications_enabled}
          disabled={isSavingPreferences}
          onCheckedChange={(value) => updatePreferences({ notifications_enabled: value })}
        />

        <SettingToggle
          icon={() => <Badge className="bg-[#CEB888] text-neutral-900 text-xs">!</Badge>}
          iconClassName="bg-amber-100 dark:bg-amber-950/50"
          title="Event Alerts"
          description="Show parking changes for active events"
          checked={preferences.event_alerts}
          disabled={isSavingPreferences}
          onCheckedChange={(value) => updatePreferences({ event_alerts: value })}
        />

        <SettingToggle
          icon={BellOff}
          iconClassName="bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300"
          title="Bus Delay Alerts"
          description="Highlight delayed buses in the app"
          checked={preferences.bus_delay_alerts}
          disabled={isSavingPreferences}
          onCheckedChange={(value) => updatePreferences({ bus_delay_alerts: value })}
        />

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              </div>
              <div>
                <div className="font-medium text-foreground">Your Permit</div>
                <div className="text-sm text-muted-foreground">Default parking filter</div>
              </div>
            </div>
            <Select
              value={preferences.default_permit || 'none'}
              onValueChange={(value) =>
                updatePreferences({ default_permit: value === 'none' ? '' : value })
              }
              disabled={isSavingPreferences}
            >
              <SelectTrigger className="w-36" aria-label="Default parking permit">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No default</SelectItem>
                {PERMIT_TYPES.map((permit) => (
                  <SelectItem key={permit} value={permit}>
                    {permit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-3"
      >
        <MenuLink to="/support" icon={HelpCircle} label="Help & Support" />
        <MenuLink to="/privacy" icon={FileText} label="Privacy Policy" />
        <MenuLink to="/about" icon={Info} label="About & Data Sources" />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-12 text-muted-foreground hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Remove Saved App Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Boiler Transport Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the favorites, permit, and alert preferences saved by Boiler Transport
                on this device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRemoveData}
              >
                Remove App Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <div className="text-xs text-muted-foreground">Boiler Transport v{APP_CONFIG.version}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {APP_CONFIG.universityAffiliated
            ? 'Campus transportation companion'
            : 'Independent campus transportation companion'}
        </div>
      </motion.div>
    </div>
  );
}

function MenuLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="block w-full" aria-label={label}>
      <Card className="p-4 hover:bg-background transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium text-foreground">{label}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

function SettingToggle({
  icon: Icon,
  iconClassName,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClassName}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="font-medium text-foreground">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
        <Switch
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          aria-label={title}
        />
      </div>
    </Card>
  );
}
