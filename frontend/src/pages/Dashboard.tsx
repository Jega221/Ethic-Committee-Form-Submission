import React, { useState, useEffect } from 'react';
import {
  Bell,
  HelpCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Plus,
  FileText,
  TrendingUp,
  Clock,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { getResearcherApplications, getUserNotifications, markNotificationAsRead } from '@/lib/api';
import { Loader } from '@/components/ui/loader';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Researcher");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    revision: 0
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Import API functions dynamically if not available in closure
  // We'll trust they are available or imported at top
  // Need to add imports for getUserNotifications, markNotificationAsRead to top of file


  useEffect(() => {
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      try {
        const user = JSON.parse(userProfile);
        if (user.name) setUserName(user.name);
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const profileStr = localStorage.getItem("userProfile");
        if (!profileStr) return;
        const user = JSON.parse(profileStr);

        // 1. Fetch Applications
        const res = await getResearcherApplications(user.id);
        const apps = Array.isArray(res.data) ? res.data : [];

        // Stats
        const counts = {
          total: apps.length,
          approved: apps.filter((a: any) => a.status.toLowerCase() === 'approved').length,
          pending: apps.filter((a: any) => !['approved', 'rejected', 'revision requested'].includes(a.status.toLowerCase())).length,
          revision: apps.filter((a: any) => a.status.toLowerCase().includes('revision')).length
        };
        setStats(counts);

        // Recent Apps (last 5)
        const sorted = [...apps].sort((a: any, b: any) =>
          new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
        ).slice(0, 5);
        setRecentApps(sorted);

        // Chart Data
        const monthlyData: any = {};
        apps.forEach((a: any) => {
          const date = new Date(a.submission_date);
          const month = date.toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedChart = months.map(m => ({
          name: m,
          applications: monthlyData[m] || 0
        })).filter((d, i) => i <= new Date().getMonth() && i >= new Date().getMonth() - 5);
        setChartData(formattedChart);

        // Pie Chart Data
        setStatusData([
          { name: 'Approved', value: counts.approved, color: '#10b981' },
          { name: 'Pending', value: counts.pending, color: '#f59e0b' },
          { name: 'Revision', value: counts.revision, color: '#f97316' },
          { name: 'Rejected', value: apps.length - (counts.approved + counts.pending + counts.revision), color: '#ef4444' }
        ].filter(d => d.value > 0));

        // 2. Fetch Notifications
        try {
          const notifRes = await getUserNotifications(user.id);
          const notifs = Array.isArray(notifRes.data) ? notifRes.data : [];
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
        } catch (err) {
          console.error("Failed to load notifications", err);
        }

      } catch (error) {
        console.error("Dashboard data fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
    if (s.includes('revision')) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Revision</Badge>;
    if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background items-center justify-center">
          <Loader />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#f8fafc]">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-slate-100 rounded-lg transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="bg-destructive/10 p-2 rounded-lg hidden sm:block">
                    <LayoutDashboard className="w-5 h-5 text-destructive" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                    Researcher Portal
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors outline-none">
                      <Bell className="w-5 h-5 text-slate-600" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 bg-destructive text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <DropdownMenuLabel className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <span>Notifications</span>
                        <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                      </div>
                    </DropdownMenuLabel>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif: any) => (
                          <DropdownMenuItem
                            key={notif.id}
                            className={`p-4 border-b border-border last:border-0 cursor-pointer ${!notif.is_read ? 'bg-muted/50' : ''}`}
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 p-1.5 rounded-full ${notif.is_read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                                <Bell className={`w-3 h-3 ${notif.is_read ? 'text-slate-500' : 'text-blue-600'}`} />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className={`text-sm ${!notif.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notif.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Welcome Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Welcome back, {userName}!
                  </h2>
                  <p className="text-slate-500 max-w-lg mb-6">
                    You have {stats.pending} applications currently under review. Your activity is up by 12% this month.
                  </p>
                  <Button
                    onClick={() => navigate('/new-application')}
                    className="bg-destructive hover:bg-destructive/90 text-white rounded-xl px-8 h-12 gap-2 shadow-lg shadow-destructive/20 transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    New Application
                  </Button>
                </div>
                <div className="hidden lg:grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approval Rate</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Clock className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg. Time</p>
                    <p className="text-2xl font-bold text-slate-800">4 Days</p>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Applications", value: stats.total, icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
                  { label: "Approved Items", value: stats.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Review Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Revision Requested", value: stats.revision, icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-50" },
                ].map((item, i) => (
                  <Card key={i} className="border-none shadow-sm card-glass overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${item.bg} group-hover:scale-110 transition-transform`}>
                          <item.icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-500 mb-1">{item.label}</p>
                      <h3 className="text-2xl font-bold text-slate-900">{item.value}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-sm card-glass">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Submission Trends</CardTitle>
                    <CardDescription>Monthly application activity</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="applications"
                          stroke="#ef4444"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorApps)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm card-glass">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Decision Ratio</CardTitle>
                    <CardDescription>Current application status split</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="border-none shadow-sm card-glass">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
                    <CardDescription>Updates from your latest submissions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive font-medium hover:text-destructive hover:bg-destructive/5" onClick={() => navigate('/study-status')}>
                    View all
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="pb-4 pl-2 font-medium">Application details</th>
                          <th className="pb-4 font-medium">Step</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium">Submitted</th>
                          <th className="pb-4 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentApps.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                              No applications found. Start your first research request now.
                            </td>
                          </tr>
                        ) : (
                          recentApps.map((app) => (
                            <tr key={app.application_id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 pl-2">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800 text-sm">{app.title}</span>
                                  <span className="text-xs text-slate-500 mt-1">ID: APP-{app.application_id}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className="text-sm font-medium text-slate-600 capitalize">
                                  {app.current_step || 'Draft'}
                                </span>
                              </td>
                              <td className="py-4">
                                {getStatusBadge(app.status)}
                              </td>
                              <td className="py-4">
                                <span className="text-sm text-slate-500">
                                  {new Date(app.submission_date).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-4 text-right pr-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full group-hover:bg-slate-200"
                                  onClick={() => navigate('/study-status')}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>

          {/* Help Button */}
          <button className="fixed bottom-8 right-8 bg-destructive text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;


