import slugify from "slugify";
import {
  getCollection,
  type CollectionEntry,
} from "astro:content";

interface Category {
  category: string;
  slug: string;
  lastPost: CollectionEntry<"blog">;
}

const getUniqueCategories = async () => {
  const posts = await getCollection("blog");

  const categories: Category[] = posts
    .flatMap(post => {
      const cats = post.data.categories ?? post.data.category;
      return Array.isArray(cats) ? cats : cats ? [cats] : [];
    })
    .filter(category => typeof category === "string" && category.trim() !== "")
    .map(category => ({
      slug: slugify(category, { lower: true, strict: true }),
      category,
      lastPost: posts
        .filter(p => {
          const cats = p.data.categories ?? p.data.category;
          const list = Array.isArray(cats) ? cats : [cats];
          return list.includes(category);
        })
        .sort(
          (a, b) =>
            new Date(b.data.modDatetime as Date).getTime() -
            new Date(a.data.modDatetime as Date).getTime()
        )[0],
    }))
    .filter(
      (value, index, self) =>
        self.findIndex(
          category => category.category === value.category
        ) === index
    )
    .sort((a, b) => a.category.localeCompare(b.category));

  return categories;
};

export default getUniqueCategories;
