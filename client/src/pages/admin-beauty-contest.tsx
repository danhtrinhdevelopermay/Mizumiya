import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Edit, Trash2, Plus, Users, Vote, Eye, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BeautyContestant {
  id: string;
  name: string;
  country: string;
  avatar: string;
  totalVotes: number;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  email: string;
}

interface ContestantVotes {
  contestant: BeautyContestant;
  votes: Array<{ user: User; voteDate: string }>;
}

export default function AdminBeautyContest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContestant, setEditingContestant] = useState<BeautyContestant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingVotes, setViewingVotes] = useState<string | null>(null);

  // Fetch contestants
  const { data: contestants = [], isLoading } = useQuery<BeautyContestant[]>({
    queryKey: ["/api/beauty-contest"],
  });

  // Fetch all votes
  const { data: allVotes = [] } = useQuery<ContestantVotes[]>({
    queryKey: ["/api/admin/beauty-contest/votes"],
  });

  // Update contestant mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; country: string; avatar: string } }) => {
      return apiRequest(`/api/admin/beauty-contest/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Cập nhật thành công", description: "Thông tin thí sinh đã được cập nhật" });
      queryClient.invalidateQueries({ queryKey: ["/api/beauty-contest"] });
      setEditingContestant(null);
    },
    onError: () => {
      toast({ title: "❌ Lỗi", description: "Không thể cập nhật thí sinh", variant: "destructive" });
    },
  });

  // Create contestant mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; country: string; avatar: string }) => {
      return apiRequest("/api/admin/beauty-contest", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Tạo thành công", description: "Thí sinh mới đã được thêm" });
      queryClient.invalidateQueries({ queryKey: ["/api/beauty-contest"] });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "❌ Lỗi", description: "Không thể tạo thí sinh mới", variant: "destructive" });
    },
  });

  // Delete contestant mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/beauty-contest/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Xóa thành công", description: "Thí sinh đã được xóa" });
      queryClient.invalidateQueries({ queryKey: ["/api/beauty-contest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/beauty-contest/votes"] });
    },
    onError: () => {
      toast({ title: "❌ Lỗi", description: "Không thể xóa thí sinh", variant: "destructive" });
    },
  });

  const handleEdit = (contestant: BeautyContestant) => {
    setEditingContestant(contestant);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContestant) return;

    const formData = new FormData(e.target as HTMLFormElement);
    updateMutation.mutate({
      id: editingContestant.id,
      data: {
        name: formData.get("name") as string,
        country: formData.get("country") as string,
        avatar: formData.get("avatar") as string,
      },
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    createMutation.mutate({
      name: formData.get("name") as string,
      country: formData.get("country") as string,
      avatar: formData.get("avatar") as string,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thí sinh này?")) {
      deleteMutation.mutate(id);
    }
  };

  const getContestantVotes = (contestantId: string) => {
    return allVotes.find(v => v.contestant.id === contestantId)?.votes || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Crown className="h-12 w-12 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Quản Lý Beauty Contest
            </h1>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" data-testid="button-add-contestant">
                <Plus className="h-4 w-4 mr-2" />
                Thêm Thí Sinh
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm Thí Sinh Mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Tên</Label>
                  <Input id="create-name" name="name" required data-testid="input-create-name" />
                </div>
                <div>
                  <Label htmlFor="create-country">Quốc Gia</Label>
                  <Input id="create-country" name="country" required data-testid="input-create-country" />
                </div>
                <div>
                  <Label htmlFor="create-avatar">Avatar URL</Label>
                  <Input id="create-avatar" name="avatar" required data-testid="input-create-avatar" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-new-contestant">
                    <Save className="h-4 w-4 mr-2" />
                    Tạo
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng Thí Sinh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contestants.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng Vote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contestants.reduce((sum, c) => sum + c.totalVotes, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Người Dẫn Đầu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {contestants.length > 0 ? contestants.sort((a, b) => b.totalVotes - a.totalVotes)[0]?.name : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contestants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Thí Sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hạng</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Quốc Gia</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contestants
                .sort((a, b) => b.totalVotes - a.totalVotes)
                .map((contestant, index) => (
                <TableRow key={contestant.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index < 3 && <Crown className={`h-4 w-4 ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        'text-amber-600'
                      }`} />}
                      <span className="font-semibold">#{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <img
                      src={contestant.avatar}
                      alt={contestant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contestant.name}</TableCell>
                  <TableCell>{contestant.country}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">
                      {contestant.totalVotes} votes
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contestant)}
                        data-testid={`button-edit-${contestant.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingVotes(contestant.id)}
                        data-testid={`button-view-votes-${contestant.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(contestant.id)}
                        data-testid={`button-delete-${contestant.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingContestant} onOpenChange={() => setEditingContestant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Thí Sinh</DialogTitle>
          </DialogHeader>
          {editingContestant && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tên</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingContestant.name}
                  required
                  data-testid="input-edit-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Quốc Gia</Label>
                <Input
                  id="edit-country"
                  name="country"
                  defaultValue={editingContestant.country}
                  required
                  data-testid="input-edit-country"
                />
              </div>
              <div>
                <Label htmlFor="edit-avatar">Avatar URL</Label>
                <Input
                  id="edit-avatar"
                  name="avatar"
                  defaultValue={editingContestant.avatar}
                  required
                  data-testid="input-edit-avatar"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingContestant(null)}
                  data-testid="button-cancel-edit"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Votes Dialog */}
      <Dialog open={!!viewingVotes} onOpenChange={() => setViewingVotes(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Danh Sách Vote
            </DialogTitle>
          </DialogHeader>
          {viewingVotes && (
            <div className="max-h-96 overflow-y-auto">
              {getContestantVotes(viewingVotes).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Chưa có vote nào</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người Vote</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ngày Vote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getContestantVotes(viewingVotes).map((vote, index) => (
                      <TableRow key={index}>
                        <TableCell className="flex items-center gap-3">
                          <img
                            src={vote.user.profileImage || "/api/placeholder/40"}
                            alt={vote.user.firstName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium">
                            {vote.user.firstName} {vote.user.lastName}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {vote.user.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {vote.voteDate}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}