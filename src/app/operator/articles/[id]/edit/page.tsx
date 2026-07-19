import ArticleForm from "../../components/ArticleForm";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleForm articleId={parseInt(id)} />;
}
