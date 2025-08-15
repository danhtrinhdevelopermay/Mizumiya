import { Bookmark, Search, Grid, List } from "lucide-react";

export default function SavedPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Saved</h1>
        <p className="text-muted-foreground">
          Items you've saved to view later
        </p>
      </div>

      {/* Search Saved Items */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your saved items..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* View Options */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">All Saved Items</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-secondary">
              <Grid className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary">
              <List className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Saved Items */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center p-8">
          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No saved items yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tap the bookmark icon on posts to save them here
          </p>
        </div>
      </div>
    </div>
  );
}