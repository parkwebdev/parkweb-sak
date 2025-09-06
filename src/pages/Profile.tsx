import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from '@untitledui/icons';
import { useSidebar } from '@/hooks/use-sidebar';

const Profile = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="max-w-4xl mx-auto px-4 lg:px-8">
            {/* Header */}
            <header className="mb-6">
              <h1 className="text-2xl font-semibold leading-tight mb-1">
                Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </header>

            {/* Profile Card */}
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" alt="Aaron Chachamovits" />
                      <AvatarFallback className="text-lg">AC</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG up to 10MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Aaron Chachamovits"
                        defaultValue="Aaron Chachamovits"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="aaron@parkweb.app"
                        defaultValue="aaron@parkweb.app"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        defaultValue="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="ParkWeb"
                        defaultValue="ParkWeb"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>
                    Your current account status and subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="complete" className="text-xs">Active</Badge>
                      <span className="text-sm">Pro Plan</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;