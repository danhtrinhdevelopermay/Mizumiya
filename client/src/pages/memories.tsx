import { Clock, Heart, Camera, Calendar } from "lucide-react";

export default function MemoriesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Memories</h1>
        <p className="text-muted-foreground">
          Look back on your posts, photos, and moments from this day in previous years
        </p>
      </div>

      {/* Today's Memories */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">On This Day</h2>
        </div>
        <div className="text-center p-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No memories from this day</p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back as you create more memories on FaceConnect
          </p>
        </div>
      </div>

      {/* Recent Memories */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold text-foreground">Recent Highlights</h2>
        </div>
        <div className="text-center p-8">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No recent highlights</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your most liked and commented posts will appear here
          </p>
        </div>
      </div>

      {/* Memory Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Memory Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-foreground">Memory Notifications</h3>
              <p className="text-sm text-muted-foreground">Get notified about your memories</p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
              <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-foreground">Include Friends in Memories</h3>
              <p className="text-sm text-muted-foreground">Show memories that include your friends</p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked/>
              <label className="toggle-label block overflow-hidden h-6 rounded-full bg-primary cursor-pointer"></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}