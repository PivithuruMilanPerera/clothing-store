"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/(dashboard)/categories/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button, Popup } from "@/components/ui";
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

function CategoryFormFields({
  nameInputId,
  imageInputId,
  parentSelectId,
  imageUrl,
  onImageUrlChange,
  parentOptions,
  defaultParentId,
  isMainCategoryLimitReached,
  disableTopLevelOption,
  requireParent,
  defaultName = "",
}: {
  nameInputId: string;
  imageInputId: string;
  parentSelectId: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  parentOptions: CategoryOption[];
  defaultParentId: string;
  isMainCategoryLimitReached: boolean;
  disableTopLevelOption?: boolean;
  requireParent?: boolean;
  defaultName?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={nameInputId}
          className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
        >
          Category Name
        </label>
        <input
          id={nameInputId}
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={defaultName}
          placeholder="e.g. Footwear"
          className="font-body w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary"
        />
      </div>

      <ImageUploadField
        label="Category Image"
        value={imageUrl}
        onChange={onImageUrlChange}
        inputId={imageInputId}
      />

      <div>
        <label
          htmlFor={parentSelectId}
          className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
        >
          Parent Category
        </label>
        <ParentCategorySelect
          id={parentSelectId}
          name="parent_id"
          options={parentOptions}
          defaultValue={defaultParentId}
          isMainCategoryLimitReached={isMainCategoryLimitReached}
          disableTopLevelOption={disableTopLevelOption}
          requireParent={requireParent}
        />
      </div>
    </div>
  );
}

function CreateCategoryPopup({
  open,
  onClose,
  parentOptions,
  isMainCategoryLimitReached,
  defaultParentId,
}: {
  open: boolean;
  onClose: () => void;
  parentOptions: CategoryOption[];
  isMainCategoryLimitReached: boolean;
  defaultParentId: string;
}) {
  const [state, formAction, pending] = useActionState(createCategory, null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (state?.success) {
      setImageUrl("");
      onClose();
    }
  }, [state?.success, onClose]);

  useEffect(() => {
    if (!open) {
      setImageUrl("");
    }
  }, [open]);

  return (
    <Popup
      open={open}
      onClose={onClose}
      title="Create Category"
      description="Create main categories (max 8) or nest sub-categories at any depth under an existing category. New main categories appear in the site header automatically."
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-category-form"
            disabled={pending}
          >
            {pending ? "Creating..." : "Create Category"}
          </Button>
        </div>
      }
    >
      <form id="create-category-form" action={formAction} className="space-y-4">
        <CategoryFormFields
          nameInputId="category-name"
          imageInputId="create-category-image"
          parentSelectId="parent-category"
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          parentOptions={parentOptions}
          defaultParentId={defaultParentId}
          isMainCategoryLimitReached={isMainCategoryLimitReached}
          disableTopLevelOption={isMainCategoryLimitReached}
          requireParent={isMainCategoryLimitReached}
        />

        {state?.error ? (
          <p className="font-body text-sm leading-normal text-error">{state.error}</p>
        ) : null}
        {state?.success ? (
          <p className="font-body text-sm leading-normal text-primary">
            {state.success}
          </p>
        ) : null}
      </form>
    </Popup>
  );
}

function EditCategoryPopup({
  node,
  onClose,
  parentOptions,
  isMainCategoryLimitReached,
}: {
  node: CategoryTreeNode;
  onClose: () => void;
  parentOptions: CategoryOption[];
  isMainCategoryLimitReached: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(node.image_url ?? "");
  const [updateState, updateAction, updatePending] = useActionState(
    updateCategory,
    null,
  );

  useEffect(() => {
    setImageUrl(node.image_url ?? "");
  }, [node.id, node.image_url]);

  useEffect(() => {
    if (updateState?.success) {
      onClose();
    }
  }, [updateState?.success, onClose]);

  const excludeIds = collectDescendantIds(node);
  const editableParentOptions = parentOptions.filter(
    (option) => !excludeIds.has(option.id),
  );

  return (
    <Popup
      open
      onClose={onClose}
      title={`Edit ${node.name}`}
      description="Update the category name, image, or parent."
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={updatePending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={`edit-category-form-${node.id}`}
            disabled={updatePending}
          >
            {updatePending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      <form
        id={`edit-category-form-${node.id}`}
        action={updateAction}
        className="space-y-4"
      >
        <input type="hidden" name="id" value={node.id} />

        <CategoryFormFields
          nameInputId={`edit-name-${node.id}`}
          imageInputId={`edit-image-${node.id}`}
          parentSelectId={`edit-parent-${node.id}`}
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          parentOptions={editableParentOptions}
          defaultParentId={node.parent_id ?? ""}
          isMainCategoryLimitReached={isMainCategoryLimitReached}
          disableTopLevelOption={
            isMainCategoryLimitReached && node.parent_id !== null
          }
          defaultName={node.name}
        />

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
      </form>
    </Popup>
  );
}

function CategoryRow({
  node,
  parentOptions,
  isMainCategoryLimitReached,
  onEdit,
}: {
  node: CategoryTreeNode;
  parentOptions: CategoryOption[];
  isMainCategoryLimitReached: boolean;
  onEdit: (node: CategoryTreeNode) => void;
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategory,
    null,
  );

  return (
    <li>
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 py-3">
        <div className="min-w-0">
          <p className="font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface">
            {node.name}
          </p>
          <p className="font-body mt-1 text-xs leading-normal text-on-surface-variant">
            /{node.slug}
            {node.parent_id ? " · Sub-category" : " · Main category"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(node)}
            aria-label={`Edit ${node.name}`}
            className="inline-flex h-7 w-7 items-center justify-center text-on-surface transition-opacity hover:opacity-70"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={node.id} />
            <button
              type="submit"
              disabled={deletePending}
              aria-label={`Delete ${node.name}`}
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
              className="inline-flex h-7 w-7 items-center justify-center text-error transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletePending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      </div>

      {deleteState?.error ? (
        <p className="font-body mt-2 text-sm leading-normal text-error">
          {deleteState.error}
        </p>
      ) : null}

      {node.children.length > 0 ? (
        <ul className="mt-1 border-l border-gray-600 pl-4">
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              parentOptions={parentOptions}
              isMainCategoryLimitReached={isMainCategoryLimitReached}
              onEdit={onEdit}
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
  onEdit,
}: {
  nodes: CategoryTreeNode[];
  parentOptions: CategoryOption[];
  isMainCategoryLimitReached: boolean;
  onEdit: (node: CategoryTreeNode) => void;
}) {
  if (nodes.length === 0) {
    return (
      <p className="font-body text-sm leading-normal text-on-surface-variant">
        No categories yet.
      </p>
    );
  }

  return (
    <ul>
      {nodes.map((node) => (
        <CategoryRow
          key={node.id}
          node={node}
          parentOptions={parentOptions}
          isMainCategoryLimitReached={isMainCategoryLimitReached}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}

export function CategoriesAdmin({ categoryTree }: CategoriesAdminProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryTreeNode | null>(null);
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

      <section className="bg-surface-container-lowest p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Category Tree
            </h2>
            <p className="font-body mt-2 text-sm leading-normal text-on-surface-variant">
              Edit names or parent, or delete a category. Deleting a parent also
              removes its nested sub-categories.
            </p>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add Category
          </Button>
        </div>

        <div className="mt-4">
          <CategoryTreeList
            nodes={categoryTree}
            parentOptions={options}
            isMainCategoryLimitReached={isMainCategoryLimitReached}
            onEdit={setEditingCategory}
          />
        </div>
      </section>

      <CreateCategoryPopup
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        parentOptions={options}
        isMainCategoryLimitReached={isMainCategoryLimitReached}
        defaultParentId={defaultParentId}
      />

      {editingCategory ? (
        <EditCategoryPopup
          key={editingCategory.id}
          node={editingCategory}
          onClose={() => setEditingCategory(null)}
          parentOptions={options}
          isMainCategoryLimitReached={isMainCategoryLimitReached}
        />
      ) : null}
    </div>
  );
}
