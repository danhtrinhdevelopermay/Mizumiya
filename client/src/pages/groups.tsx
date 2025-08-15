import { Users, Plus, Search } from "lucide-react";

export default function GroupsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Groups</h1>
        <p className="text-muted-foreground">
          Discover and join groups that match your interests
        </p>
      </div>

      {/* Create Group Button */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <button className="flex items-center space-x-3 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-secondary transition-colors">
          <Plus className="h-6 w-6 text-primary" />
          <span className="text-foreground font-medium">Create New Group</span>
        </button>
      </div>

      {/* Search Groups */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Groups You've Joined */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Groups</h2>
        <div className="text-center p-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You haven't joined any groups yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Join groups to connect with people who share your interests
          </p>
        </div>
      </div>

      {/* Suggested Groups */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Suggested for You</h2>
        <div className="text-center p-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No group suggestions available</p>
          <p className="text-sm text-muted-foreground mt-2">
            We'll suggest groups based on your interests and activity
          </p>
        </div>
      </div>
    </div>
  );
}