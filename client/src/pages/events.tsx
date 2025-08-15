import { Calendar, Plus, Search, MapPin, Clock } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Events</h1>
        <p className="text-muted-foreground">
          Discover events happening near you
        </p>
      </div>

      {/* Create Event Button */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <button className="flex items-center space-x-3 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-secondary transition-colors">
          <Plus className="h-6 w-6 text-primary" />
          <span className="text-foreground font-medium">Create Event</span>
        </button>
      </div>

      {/* Search Events */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Event Categories */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Online", icon: "💻" },
            { name: "Music", icon: "🎵" },
            { name: "Sports", icon: "⚽" },
            { name: "Food & Drink", icon: "🍕" },
          ].map((category) => (
            <button
              key={category.name}
              className="p-4 border rounded-lg hover:bg-secondary transition-colors text-center"
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <span className="text-sm text-foreground">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Events</h2>
        <div className="text-center p-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No upcoming events</p>
          <p className="text-sm text-muted-foreground mt-2">
            Events you're interested in or attending will appear here
          </p>
        </div>
      </div>

      {/* Suggested Events */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Suggested Events</h2>
        <div className="text-center p-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No event suggestions available</p>
          <p className="text-sm text-muted-foreground mt-2">
            We'll suggest events based on your interests and location
          </p>
        </div>
      </div>
    </div>
  );
}