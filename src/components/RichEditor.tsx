"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useState } from "react";

// A small WYSIWYG editor that mirrors its HTML into a hidden input named `name`,
// so it submits with a normal <form> / server action. Supports headings, lists,
// bold/italic, links and images.
export default function RichEditor({
  name,
  initialHTML = "",
  placeholder = "Write here…",
}: {
  name: string;
  initialHTML?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(initialHTML);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: initialHTML || `<p></p>`,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[220px] rounded-b-md border border-t-0 border-neutral-300 bg-white p-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const btn =
    "px-2 py-1 text-sm rounded hover:bg-neutral-200 border border-transparent";

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-md border border-neutral-300 bg-neutral-100 p-1">
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          🔗 Link
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const url = window.prompt("Image URL");
            if (url) editor?.chain().focus().setImage({ src: url }).run();
          }}
        >
          🖼 Image
        </button>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
