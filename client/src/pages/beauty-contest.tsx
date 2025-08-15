import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart, Star, Sparkles, Trophy, Vote, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BeautyContestant {
  id: string;
  name: string;
  country: string;
  avatar: string;
  totalVotes: number;
}

interface VoteResponse {
  success: boolean;
  message: string;
  remainingVotes: number;
}

export default function BeautyContest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVoteAlert, setShowVoteAlert] = useState(false);
  const [votedContestant, setVotedContestant] = useState<BeautyContestant | null>(null);

  // Fetch contestants
  const { data: contestants = [], isLoading } = useQuery<BeautyContestant[]>({
    queryKey: ["/api/beauty-contest"],
  });

  // Fetch remaining votes
  const { data: remainingVotesData } = useQuery<{ remainingVotes: number }>({
    queryKey: ["/api/beauty-contest/remaining-votes"],
  });

  // Remove voted contestants tracking since users can vote multiple times

  const remainingVotes = remainingVotesData?.remainingVotes || 0;

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (contestantId: string) => {
      const response = await apiRequest("POST", `/api/beauty-contest/${contestantId}/vote`);
      return response.json() as Promise<VoteResponse>;
    },
    onMutate: async (contestantId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/beauty-contest"] });
      await queryClient.cancelQueries({ queryKey: ["/api/beauty-contest/remaining-votes"] });
      
      // Snapshot current values
      const previousContestants = queryClient.getQueryData<BeautyContestant[]>(["/api/beauty-contest"]);
      const previousVotes = queryClient.getQueryData<{ remainingVotes: number }>(["/api/beauty-contest/remaining-votes"]);
      
      // Optimistically update contestants
      if (previousContestants) {
        queryClient.setQueryData<BeautyContestant[]>(["/api/beauty-contest"], (old) =>
          old?.map(contestant =>
            contestant.id === contestantId
              ? { ...contestant, totalVotes: contestant.totalVotes + 1 }
              : contestant
          ) || []
        );
      }
      
      // Optimistically update remaining votes
      if (previousVotes) {
        queryClient.setQueryData<{ remainingVotes: number }>(["/api/beauty-contest/remaining-votes"], {
          remainingVotes: Math.max(0, previousVotes.remainingVotes - 1)
        });
      }
      
      return { previousContestants, previousVotes };
    },
    onSuccess: (data: VoteResponse) => {
      // Refresh data to ensure consistency in background
      queryClient.invalidateQueries({ queryKey: ["/api/beauty-contest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/beauty-contest/remaining-votes"] });
    },
    onError: (error: any, contestantId: string, context) => {
      // Revert optimistic updates on error
      if (context?.previousContestants) {
        queryClient.setQueryData(["/api/beauty-contest"], context.previousContestants);
      }
      if (context?.previousVotes) {
        queryClient.setQueryData(["/api/beauty-contest/remaining-votes"], context.previousVotes);
      }
      
      // Show specific error message based on error type
      let errorMessage = "Có lỗi xảy ra";
      if (error?.message?.includes("out of daily votes")) {
        errorMessage = "Bạn đã sử dụng hết 5 lượt vote hôm nay!";
      } else if (error?.message?.includes("already voted")) {
        errorMessage = "Bạn đã vote cho thí sinh này hôm nay rồi!";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Không thể vote",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleVote = (contestantId: string) => {
    if (remainingVotes <= 0) {
      toast({
        title: "⚠️ Hết lượt vote",
        description: "Bạn đã sử dụng hết 5 lượt vote hôm nay!",
        variant: "destructive",
      });
      return;
    }

    // Show beautiful vote alert immediately
    const contestant = contestants.find(c => c.id === contestantId);
    if (contestant) {
      setVotedContestant(contestant);
      setShowVoteAlert(true);
      // Auto hide alert after 3 seconds
      setTimeout(() => {
        setShowVoteAlert(false);
        setVotedContestant(null);
      }, 3000);
    }

    voteMutation.mutate(contestantId);
  };

  const sortedContestants = [...contestants].sort((a, b) => b.totalVotes - a.totalVotes);
  const top5 = sortedContestants.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải cuộc thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chinese-cream via-background to-chinese-pink/30">
      <div className="container mx-auto px-2 sm:px-4 py-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-chinese-red via-chinese-orange to-chinese-gold bg-clip-text text-transparent drop-shadow-2xl font-serif">
              🌺 Nữ Hoàng Đẹp 🌺
            </h1>
            {/* Decorative elements with Chinese style */}
            <div className="absolute -top-6 -left-12 opacity-80">
              <div className="text-6xl">🌸</div>
            </div>
            <div className="absolute -top-6 -right-12 opacity-80">
              <div className="text-6xl">🌺</div>
            </div>
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <Sparkles className="h-8 w-8 text-chinese-gold animate-pulse" />
            </div>
            <div className="absolute -bottom-8 left-1/4">
              <Sparkles className="h-6 w-6 text-chinese-red animate-pulse" />
            </div>
            <div className="absolute -bottom-8 right-1/4">
              <Sparkles className="h-6 w-6 text-chinese-orange animate-pulse" />
            </div>
          </div>
          
          {/* Vote Counter with Chinese luxury style */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-chinese-pink/30 to-chinese-cream/50 backdrop-blur-md rounded-3xl px-8 py-4 shadow-xl border-2 border-chinese-gold/50">
            <Heart className="h-6 w-6 text-chinese-red fill-chinese-red animate-bounce" />
            <span className="font-bold text-lg text-chinese-brown">
              Còn lại: {remainingVotes}/5 lượt vote hôm nay
            </span>
          </div>
        </div>

        {/* Top 5 Ranking with Chinese luxury style */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-chinese-red to-chinese-gold bg-clip-text text-transparent font-serif mb-2">
              👑 Bảng Xếp Hạng Hoàng Gia
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-chinese-gold to-chinese-red mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {top5.map((contestant, index) => (
              <Card 
                key={contestant.id} 
                className={`relative overflow-hidden transform hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-3xl ${
                  index === 0 
                    ? 'bg-gradient-to-br from-chinese-gold/30 to-chinese-orange/20 border-2 border-chinese-gold' 
                    : index === 1 
                    ? 'bg-gradient-to-br from-chinese-cream/60 to-chinese-pink/20 border-2 border-chinese-pink'
                    : index === 2
                    ? 'bg-gradient-to-br from-chinese-orange/20 to-chinese-red/20 border-2 border-chinese-orange'
                    : index === 3
                    ? 'bg-gradient-to-br from-chinese-jade/20 to-chinese-cream/30 border-2 border-chinese-jade'
                    : 'bg-gradient-to-br from-chinese-purple/20 to-chinese-pink/20 border-2 border-chinese-purple'
                } backdrop-blur-md rounded-3xl`}
              >
                <CardContent className="p-4 text-center relative">
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    {index === 0 && (
                      <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Top 1
                      </div>
                    )}
                    {index === 1 && (
                      <div className="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Top 2
                      </div>
                    )}
                    {index === 2 && (
                      <div className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Top 3
                      </div>
                    )}
                    {index === 3 && (
                      <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Top 4
                      </div>
                    )}
                    {index === 4 && (
                      <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Top 5
                      </div>
                    )}
                  </div>

                  {/* Crown for Top 1 */}
                  {index === 0 && (
                    <div className="absolute top-1 right-2 z-10">
                      <Crown className="h-6 w-6 text-yellow-500" />
                    </div>
                  )}

                  <div className="relative mb-4 mt-3">
                    <div className="relative">
                      <img
                        src={contestant.avatar}
                        alt={contestant.name}
                        className="w-24 h-24 rounded-2xl mx-auto object-cover border-4 border-chinese-gold/60 shadow-xl"
                      />
                      {/* Decorative frame */}
                      <div className="absolute -inset-2 rounded-3xl border-2 border-chinese-gold/30 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-base mb-2 text-chinese-brown font-serif">
                    {contestant.name}
                  </h3>
                  <p className="text-sm text-chinese-brown/70 mb-3 font-medium">
                    {contestant.country}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4 bg-chinese-pink/20 rounded-full px-3 py-1">
                    <Heart className="h-4 w-4 text-chinese-red fill-chinese-red animate-pulse" />
                    <span className="text-sm font-bold text-chinese-red">
                      {contestant.totalVotes} ❤️
                    </span>
                  </div>

                  <Button
                    onClick={() => handleVote(contestant.id)}
                    disabled={remainingVotes <= 0}
                    size="sm"
                    className="w-full bg-gradient-to-r from-chinese-red to-chinese-orange hover:from-chinese-orange hover:to-chinese-gold text-white font-bold border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl transform hover:scale-105"
                    data-testid={`button-vote-${contestant.id}`}
                  >
                    🌸 Bình chọn 🌸
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Contestants */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-700">
            ✨ Tất Cả Thí Sinh ✨
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sortedContestants.map((contestant, index) => (
              <Card 
                key={contestant.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/60 backdrop-blur-sm border-0 shadow-lg"
              >
                <CardContent className="p-4 text-center">
                  <div className="relative mb-3">
                    <img
                      src={contestant.avatar}
                      alt={contestant.name}
                      className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-white shadow-md"
                    />
                  </div>
                  
                  <h3 className="font-semibold text-sm mb-1 text-gray-800">
                    {contestant.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {contestant.country}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                    <span className="text-sm font-medium text-pink-600">
                      {contestant.totalVotes}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleVote(contestant.id)}
                    disabled={remainingVotes <= 0}
                    size="sm"
                    className="w-full bg-pink-300 hover:bg-pink-400 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
                    data-testid={`button-vote-all-${contestant.id}`}
                  >
                    Vote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Beautiful Vote Success Alert */}
      {showVoteAlert && votedContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl border border-white/50 animate-in fade-in duration-300 slide-in-from-bottom-4">
            {/* Close button */}
            <button
              onClick={() => {
                setShowVoteAlert(false);
                setVotedContestant(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Success animation */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Heart className="h-10 w-10 text-white fill-white" />
                </div>
                {/* Sparkle effects */}
                <div className="absolute -top-2 -left-2">
                  <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Vote thành công! 🎉
              </h3>
              <p className="text-gray-600 mb-4">
                Bạn đã vote cho <span className="font-semibold text-pink-600">{votedContestant.name}</span>
              </p>
              
              {/* Contestant info */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <img
                  src={votedContestant.avatar}
                  alt={votedContestant.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">{votedContestant.name}</p>
                  <p className="text-xs text-gray-600">{votedContestant.country}</p>
                </div>
              </div>

              <div className="bg-white/70 rounded-full px-4 py-2 inline-flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                <span className="text-sm font-medium text-pink-600">
                  Vote đã được ghi nhận!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}