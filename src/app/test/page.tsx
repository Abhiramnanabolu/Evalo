'use client'

import RichTextEditor from "@/components/QuestionEditor"

export default function Page() {
  return (
    <div className="p-6">
      <RichTextEditor
        onChange={(html) => {
          console.log("Editor HTML:", html);
        }}
      />
    </div>
  );
}