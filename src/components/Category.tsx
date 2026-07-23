import { descriptions } from "@pages/blog/categories/descriptions";
import slugify from "slugify";
import type { CollectionEntry } from "astro:content";
import React from "react";

type CategoryProps = {
  title: string;
  lastPost?: CollectionEntry<"blog">;
};

type CategoryKeys = keyof typeof descriptions;

function Category({ title, lastPost }: CategoryProps) {
  return (
    <li className="my-6">
      <a
        href={`/blog/categories/${slugify(title, { lower: true, strict: true })}/`}
        className="text-skin-accent inline-block text-lg font-medium decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
      >
        <h2>{title}</h2>
      </a>
      <div className="my-1 flex gap-1">
        <a href={`/blog/${lastPost?.slug}/`} className="text-sm">
          <b>Latest post</b>: {lastPost?.data.title}
        </a>
      </div>
      <p className="text-sm">
        <b>Description</b>:{" "}
        {descriptions[title as CategoryKeys] ??
          `Posts relevant to everything related to ${title.toLowerCase()}`}
      </p>
    </li>
  );
}

export default Category;
