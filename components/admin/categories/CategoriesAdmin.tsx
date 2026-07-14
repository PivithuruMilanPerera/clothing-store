"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/(dashboard)/categories/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  MAX_MAIN_CATEGORIES,
  type CategoryTreeNode,
} from "@/lib/category-types";

type CategoriesAdminProps = {
  categoryTree: CategoryTreeNode[];
};

type CategoryOption = {
  id: string;
  label: string;
};

function flattenCategoryOptions(
  nodes: CategoryTreeNode[],
  depth = 0,
  excludeIds: Set<string> = new Set(),
): CategoryOption[] {
  return nodes.flatMap((node) => {
    if (excludeIds.has(node.id)) {
      return [];
    }

    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    return [
      { id: node.id, label: `${prefix}${node.name}` },
      ...flattenCategoryOptions(node.children, depth + 1, excludeIds),
    ];
  });
}

function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>([node.id]);
  for (const child of node.children) {
    for (const id of collectDescendantIds(child)) {
      ids.add(id);
    }
  }
  return ids;
}

function ParentCategorySelect({
  id,
  name,
  options,
  defaultValue,
  isMainCategoryLimitReached,
  disableTopLevelOption = false,
  requireParent = false,
}: {
  id: string;
  name: string;
  options: CategoryOption[];
  defaultValue: string;
  isMainCategoryLimitReached: boolean;
  disableTopLevelOption?: boolean;
  requireParent?: boolean;
}) {
  return (
    <>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={requireParent}
        className="font-body w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
      >
        <option value="" disabled={disableTopLevelOption}>
          {disableTopLevelOption
            ? `Top-level main category (${MAX_MAIN_CATEGORIES}/${MAX_MAIN_CATEGORIES} used)`
            : "Top-level main category"}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {isMainCategoryLimitReached ? (
        <p className="font-body mt-2 text-xs leading-normal text-on-surface-variant">
          {disableTopLevelOption
            ? "The main category limit is reached. Choose an existing category as the parent to create a sub-category."
            : "The main category limit is reached. This category can stay top-level, but other sub-categories cannot be promoted to main."}
        </p>
      ) : null}
    </>
  );
}

function CategoryRow({
  node,
  parentOptions,
  isMainCategoryLimitReached,
}: {
  node: CategoryTreeNode;
  parentOptions: CategoryOption[];
  isMainCategoryLimitReached: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(node.image_url ?? "");
  const [updateState, updateAction, updatePending] = useActionState(
    updateCategory,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategory,
    null,
  );

  useEffect(() => {
    if (updateState?.success) {
      setIsEditing(false);
    }
  }, [updateState?.success]);

  const excludeIds = collectDescendantIds(node);
  const editableParentOptions = parentOptions.filter(
    (option) => !excludeIds.has(option.id),
  );

  return (
    <li className="rounded-sm border border-outline-variant p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface">
            {node.name}
          </p>
          <p className="font-body mt-1 text-xs leading-normal text-on-surface-variant">
            /{node.slug}
            {node.parent_id ? " · Sub-category" : " · Main category"}
          </p>
        </div>

        {!isEditing ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="font-label border border-outline-variant px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] leading-none text-on-surface transition-opacity hover:opacity-70"
            >
              Edit
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={node.id} />
              <button
                type="submit"
                disabled={deletePending}
                onClick={(event) => {
                  const confirmed = window.confirm(
                    node.children.length > 0
                      ? `Delete “${node.name}” and all of its sub-categories?`
                      : `Delete “${node.name}”?`,
                  );
                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
                className="font-label border border-error px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] leading-none text-error transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletePending ? "Deleting..." : "Delete"}
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {deleteState?.error ? (
        <p className="font-body mt-2 text-sm leading-normal text-error">
          {deleteState.error}
        </p>
      ) : null}

      {isEditing ? (
        <form action={updateAction} className="mt-4 space-y-3 border-t border-outline-variant pt-4">
          <input type="hidden" name="id" value={node.id} />
          <div>
            <label
              htmlFor={`edit-name-${node.id}`}
              className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
            >
              Category Name
            </label>
            <input
              id={`edit-name-${node.id}`}
              name="name"
              type="text"
              required
              maxLength={80}
              defaultValue={node.name}
              className="font-body w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <ImageUploadField
              label="Category Image"
              value={imageUrl}
              onChange={setImageUrl}
              inputId={`edit-image-${node.id}`}
            />
          </div>
          <div>
            <label
              htmlFor={`edit-parent-${node.id}`}
              className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
            >
              Parent Category
            </label>
            <ParentCategorySelect
              id={`edit-parent-${node.id}`}
              name="parent_id"
              options={editableParentOptions}
              defaultValue={node.parent_id ?? ""}
              isMainCategoryLimitReached={isMainCategoryLimitReached}
              disableTopLevelOption={
                isMainCategoryLimitReached && node.parent_id !== null
              }
            />
          </div>

          {updateState?.error ? (
            <p className="font-body text-sm leading-normal text-error">
              {updateState.error}
            </p>
          ) : null}
          {updateState?.success ? (
            <p className="font-body text-sm leading-normal text-primary">
              {updateState.success}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={updatePending}
              className="font-label inline-flex items-center justify-center border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatePending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={updatePending}
              className="font-label border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {node.children.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l border-outline-variant pl-4">
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              parentOptions={parentOptions}
              isMainCategoryLimitReached={isMainCategoryLimitReached}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CategoryTreeList({
  nodes,
  parentOptions,
  isMainCategoryLimitReached,
}: {
  nodes: CategoryTreeNode[];
  parentOptions: CategoryOption[];
  isMainCategoryLimitReached: boolean;
}) {
  if (nodes.length === 0) {
    return (
      <p className="font-body text-sm leading-normal text-on-surface-variant">
        No categories yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {nodes.map((node) => (
        <CategoryRow
          key={node.id}
          node={node}
          parentOptions={parentOptions}
          isMainCategoryLimitReached={isMainCategoryLimitReached}
        />
      ))}
    </ul>
  );
}

export function CategoriesAdmin({ categoryTree }: CategoriesAdminProps) {
  const [state, formAction, pending] = useActionState(createCategory, null);
  const [createImageUrl, setCreateImageUrl] = useState("");
  const options = flattenCategoryOptions(categoryTree);
  const isMainCategoryLimitReached =
    categoryTree.length >= MAX_MAIN_CATEGORIES;
  const defaultParentId =
    isMainCategoryLimitReached && options.length > 0 ? options[0].id : "";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Admin
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          Categories
        </h1>
      </div>

      <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
          Create Category
        </h2>
        <p className="font-body mt-2 text-sm leading-normal text-on-surface-variant">
          Create main categories (max 8) or nest sub-categories at any depth
          under an existing category, for example Men → Casual Wear → T Shirt.
          New main categories appear in the site header automatically.
        </p>
        <form action={formAction} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
            >
              Category Name
            </label>
            <input
              id="category-name"
              name="name"
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Footwear"
              className="font-body w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
            />
          </div>
          <ImageUploadField
            label="Category Image"
            value={createImageUrl}
            onChange={setCreateImageUrl}
            inputId="create-category-image"
          />
          <div>
            <label
              htmlFor="parent-category"
              className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
            >
              Parent Category
            </label>
            <ParentCategorySelect
              id="parent-category"
              name="parent_id"
              options={options}
              defaultValue={defaultParentId}
              isMainCategoryLimitReached={isMainCategoryLimitReached}
              disableTopLevelOption={isMainCategoryLimitReached}
              requireParent={isMainCategoryLimitReached}
            />
          </div>

          {state?.error ? (
            <p className="font-body text-sm leading-normal text-error">
              {state.error}
            </p>
          ) : null}
          {state?.success ? (
            <p className="font-body text-sm leading-normal text-primary">
              {state.success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="font-label inline-flex items-center justify-center border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating..." : "Create Category"}
          </button>
        </form>
      </section>

      <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
          Category Tree
        </h2>
        <p className="font-body mt-2 text-sm leading-normal text-on-surface-variant">
          Edit names or parent, or delete a category. Deleting a parent also
          removes its nested sub-categories.
        </p>
        <div className="mt-4">
          <CategoryTreeList
            nodes={categoryTree}
            parentOptions={options}
            isMainCategoryLimitReached={isMainCategoryLimitReached}
          />
        </div>
      </section>
    </div>
  );
}
