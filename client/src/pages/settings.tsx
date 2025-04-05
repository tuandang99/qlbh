import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StoreSettings } from "@/components/settings/store-settings";
import { BackupRestore } from "@/components/system/backup-restore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Database, Store } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("store");
  
  return (
    <MainLayout title="Cài đặt hệ thống" requireAuth={true} allowedRoles={["admin"]}>
      <Card className="border border-neutral-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Cài đặt hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="store" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="store" className="flex items-center">
                <Store className="h-4 w-4 mr-2" />
                Thông tin cửa hàng
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Sao lưu & Khôi phục
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="store">
              <StoreSettings />
            </TabsContent>
            
            <TabsContent value="backup">
              <BackupRestore />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
