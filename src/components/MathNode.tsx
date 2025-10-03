import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import katex from "katex"
import "katex/dist/katex.min.css"

const MathNode = Node.create({
  name: "math",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      value: {
        default: "",
      },
    }
  },

  parseHTML() {
    return [{ tag: "span[data-type=math]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "math" })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent)
  },
})

function MathComponent({ node }: any) {
  return (
    <NodeViewWrapper as="span" className="math-inline">
      <span
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(node.attrs.value || "", {
            throwOnError: false,
            displayMode: false,
          }),
        }}
      />
    </NodeViewWrapper>
  )
}

export default MathNode