import Layout from "@/components/layout/layout";
import UserSearch from "@/components/search/user-search";

export default function SearchPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tìm kiếm người dùng
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tìm và kết bạn với những người bạn biết
          </p>
        </div>
        <UserSearch />
      </div>
    </Layout>
  );
}