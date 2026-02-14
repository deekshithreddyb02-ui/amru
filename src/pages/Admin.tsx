import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Mail, FileText, LogOut, Trash2, Eye, EyeOff, Home, LayoutDashboard, Wrench, Image } from "lucide-react";
import { motion } from "framer-motion";
import ContentEditor from "@/components/admin/ContentEditor";
import ServiceEditor from "@/components/admin/ServiceEditor";
import GalleryEditor from "@/components/admin/GalleryEditor";

interface User {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      const usersWithRoles = rolesData?.map(r => ({
        id: r.user_id,
        email: r.user_id,
        created_at: r.created_at,
        role: r.role
      })) || [];

      setUsers(usersWithRoles);

      const { data: messagesData, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleMessageRead = async (id: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: !isRead })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(m => 
        m.id === id ? { ...m, is_read: !isRead } : m
      ));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.filter(m => m.id !== id));
      toast({ title: "Success", description: "Message deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        _target_user_id: userId,
        _new_role: 'admin'
      });

      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: 'admin' } : u
      ));
      toast({ title: "Success", description: "User promoted to admin" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        _target_user_id: userId,
        _new_role: 'user'
      });

      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: 'user' } : u
      ));
      toast({ title: "Success", description: "Admin privileges removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (adminLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <h1 className="text-xl font-serif font-semibold">Admin Dashboard</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <Mail className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {messages.length}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="messages">
            <TabsList className="mb-4">
              <TabsTrigger value="messages">
                Messages {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="content">
                <LayoutDashboard className="w-4 h-4 mr-1" />
                Site Content
              </TabsTrigger>
              <TabsTrigger value="services">
                <Wrench className="w-4 h-4 mr-1" />
                Services
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <Image className="w-4 h-4 mr-1" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messages.map((msg) => (
                          <TableRow key={msg.id} className={!msg.is_read ? "bg-primary/5" : ""}>
                            <TableCell>
                              <Badge variant={msg.is_read ? "secondary" : "default"}>
                                {msg.is_read ? "Read" : "New"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{msg.name}</TableCell>
                            <TableCell>{msg.email}</TableCell>
                            <TableCell>{msg.phone || "-"}</TableCell>
                            <TableCell>{msg.service || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                            <TableCell>{new Date(msg.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleMessageRead(msg.id, msg.is_read)}
                                >
                                  {msg.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteMessage(msg.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <ContentEditor />
            </TabsContent>

            <TabsContent value="services">
              <ServiceEditor />
            </TabsContent>

            <TabsContent value="gallery">
              <GalleryEditor />
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No users yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAdmin(user.id)}
                                >
                                  Remove Admin
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => makeAdmin(user.id)}
                                >
                                  Make Admin
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
