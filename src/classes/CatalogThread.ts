import $ from "../platform/$"

export default class CatalogThread {
  ID: string
  thread: any
  board: string
  nodes: { root: any; thumb: any; icons: any; postCount: any; fileCount: any; pageCount: any; replies: any }
  toString() { return this.ID }

  constructor(root: any, thread: any) {
    this.thread = thread
    this.ID    = this.thread.ID
    this.board = this.thread.board
    const {post} = this.thread.OP.nodes
    this.nodes = {
      root,
      thumb:     $('.catalog-thumb', post),
      icons:     $('.catalog-icons', post),
      postCount: $('.post-count',    post),
      fileCount: $('.file-count',    post),
      pageCount: $('.page-count',    post),
      replies:   null
    }
    this.thread.catalogView = this
  }
}
