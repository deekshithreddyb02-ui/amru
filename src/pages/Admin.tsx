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
import { sanitizeError } from "@/lib/errors";
import { Loader2, Users, Mail, FileText, LogOut, Trash2, Eye, EyeOff, Home, LayoutDashboard, Wrench, Image, Navigation, MapPin, PanelBottom, Search, Sparkles, Info, HelpCircle, MessageSquareQuote, Scale, Filter, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

import ServiceEditor from "@/components/admin/ServiceEditor";
import GalleryEditor from "@/components/admin/GalleryEditor";
import NavbarEditor from "@/components/admin/NavbarEditor";
import OfficeEditor from "@/components/admin/OfficeEditor";
import FooterEditor from "@/components/admin/FooterEditor";
import HeroEditor from "@/components/admin/HeroEditor";
import AboutEditor from "@/components/admin/AboutEditor";
import WhyUsEditor from "@/components/admin/WhyUsEditor";
import TestimonialsEditor from "@/components/admin/TestimonialsEditor";
import LegalNoticeEditor from "@/components/admin/LegalNoticeEditor";

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
  const [userSearch, setUserSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

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
      const [rolesRes, usersRes, messagesRes] = await Promise.all([
        supabase.from('user_roles').select('user_id, role, created_at'),
        supabase.rpc('get_users_with_emails'),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      ]);

      if (rolesRes.error) throw rolesRes.error;

      const emailMap = new Map<string, { email: string; created_at: string }>();
      if (!usersRes.error && usersRes.data) {
        usersRes.data.forEach((u: any) => emailMap.set(u.user_id, { email: u.email, created_at: u.created_at }));
      }

      const usersWithRoles = rolesRes.data?.map(r => ({
        id: r.user_id,
        email: emailMap.get(r.user_id)?.email || r.user_id,
        created_at: emailMap.get(r.user_id)?.created_at || r.created_at,
        role: r.role
      })) || [];

      setUsers(usersWithRoles);

      if (messagesRes.error) throw messagesRes.error;
      setMessages(messagesRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
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
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
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
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
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
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
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
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
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
              <TabsTrigger value="hero">
                <Sparkles className="w-4 h-4 mr-1" />
                Hero
              </TabsTrigger>
              <TabsTrigger value="about">
                <Info className="w-4 h-4 mr-1" />
                About Us
              </TabsTrigger>
              <TabsTrigger value="whyus">
                <HelpCircle className="w-4 h-4 mr-1" />
                Why Us
              </TabsTrigger>
              <TabsTrigger value="testimonials">
                <MessageSquareQuote className="w-4 h-4 mr-1" />
                Testimonials
              </TabsTrigger>
              <TabsTrigger value="services">
                <Wrench className="w-4 h-4 mr-1" />
                Services
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <Image className="w-4 h-4 mr-1" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="navbar">
                <Navigation className="w-4 h-4 mr-1" />
                Navbar
              </TabsTrigger>
              <TabsTrigger value="offices">
                <MapPin className="w-4 h-4 mr-1" />
                Office Maps
              </TabsTrigger>
              <TabsTrigger value="footer">
                <PanelBottom className="w-4 h-4 mr-1" />
                Footer
              </TabsTrigger>
              <TabsTrigger value="legal">
                <Scale className="w-4 h-4 mr-1" />
                Legal Notice
              </TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                  <CardTitle>Contact Messages</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          <SelectItem value="Pune">Pune</SelectItem>
                          <SelectItem value="Mumbai">Mumbai</SelectItem>
                          <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                          <SelectItem value="Bangalore">Bangalore</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="none">No Location</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Select onValueChange={(loc) => {
                      const parsed = messages.map((msg) => {
                        const match = msg.message.match(/^\[Location: (.+?)\] /);
                        return {
                          ...msg,
                          location: match ? match[1] : null,
                          cleanMessage: match ? msg.message.replace(match[0], '') : msg.message,
                        };
                      });
                      const filtered = loc === "none"
                        ? parsed.filter(m => !m.location)
                        : parsed.filter(m => m.location === loc);
                      if (filtered.length === 0) {
                        toast({ title: "No data", description: `No messages found for ${loc}` });
                        return;
                      }
                      const header = "Name,Email,Phone,Service,Location,Message,Date,Status\n";
                      const rows = filtered.map(m =>
                        [m.name, m.email, m.phone || '', m.service || '', m.location || 'N/A', `"${m.cleanMessage.replace(/"/g, '""')}"`, new Date(m.created_at).toLocaleDateString(), m.is_read ? 'Read' : 'New'].join(',')
                      ).join('\n');
                      const blob = new Blob([header + rows], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `messages-${loc.toLowerCase()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      <SelectTrigger className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          <span>Download by Location</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pune">Pune Messages</SelectItem>
                        <SelectItem value="Mumbai">Mumbai Messages</SelectItem>
                        <SelectItem value="Hyderabad">Hyderabad Messages</SelectItem>
                        <SelectItem value="Bangalore">Bangalore Messages</SelectItem>
                        <SelectItem value="Other">Other Messages</SelectItem>
                        <SelectItem value="none">No Location Messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                          <TableHead>Location</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messages
                          .map((msg) => {
                            const locationMatch = msg.message.match(/^\[Location: (.+?)\] /);
                            const location = locationMatch ? locationMatch[1] : null;
                            const cleanMessage = locationMatch ? msg.message.replace(locationMatch[0], '') : msg.message;
                            return { ...msg, location, cleanMessage };
                          })
                          .filter((msg) => {
                            if (locationFilter === "all") return true;
                            if (locationFilter === "none") return !msg.location;
                            return msg.location === locationFilter;
                          })
                          .map((msg) => (
                          <TableRow key={msg.id} className={!msg.is_read ? "bg-primary/5" : ""}>
                            <TableCell>
                              <Badge variant={msg.is_read ? "secondary" : "default"}>
                                {msg.is_read ? "Read" : "New"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{msg.name}</TableCell>
                            <TableCell>{msg.email}</TableCell>
                            <TableCell>{msg.phone || "-"}</TableCell>
                            <TableCell>
                              {msg.location ? (
                                <Badge variant="outline">{msg.location}</Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell>{msg.service || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{msg.cleanMessage}</TableCell>
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

            <TabsContent value="hero">
              <HeroEditor />
            </TabsContent>

            <TabsContent value="about">
              <AboutEditor />
            </TabsContent>

            <TabsContent value="whyus">
              <WhyUsEditor />
            </TabsContent>

            <TabsContent value="testimonials">
              <TestimonialsEditor />
            </TabsContent>

            <TabsContent value="services">
              <ServiceEditor />
            </TabsContent>

            <TabsContent value="gallery">
              <GalleryEditor />
            </TabsContent>

            <TabsContent value="navbar">
              <NavbarEditor />
            </TabsContent>

            <TabsContent value="offices">
              <OfficeEditor />
            </TabsContent>

            <TabsContent value="footer">
              <FooterEditor />
            </TabsContent>

            <TabsContent value="legal">
              <LegalNoticeEditor />
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by email or ID..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No users yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                         <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter(u => {
                            if (!userSearch) return true;
                            const q = userSearch.toLowerCase();
                            return u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
                          })
                          .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
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
