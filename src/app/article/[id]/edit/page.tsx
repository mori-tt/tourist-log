import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const EditArticlePage = () => {
  const router = useRouter();

  return (
    <div className="flex gap-4 mt-4">
      <Button type="button" onClick={() => router.back()}>
        戻る
      </Button>
      <Button type="submit">更新する</Button>
    </div>
  );
};

export default EditArticlePage;
