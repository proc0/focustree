class TaskControl extends HTMLElement {
  base = null
  menu = null
  // dragging
  movingNode = null
  underNode = null
  placement = null
  mouseY = null

  constructor() {
    super()
  }

  bindDragEvents() {
    this.addEventListener('dragstart', (e) => {
      this.movingNode = e.target
      e.target.classList.add('dragging')
    })

    this.addEventListener('dragend', this.dragEnd)

    this.addEventListener('dragover', this.dragOver)
  }

  dragEnd(event) {
    event.stopPropagation()
    // dropping it on itself
    if (!this.underNode || !this.placement || this.movingNode === this.underNode) {
      // cleanup
      this.underNode?.classList.remove('over')
      this.movingNode = null
      this.underNode = null
      this.placement = null
      return
    }

    // dropping a branch on task-base to become root
    if (this.placement === 'root') {
      // scenario: a branch node is promoted to root node
      const newIndex = this.getRootNodes().length
      const newTask = this.movingNode.graftTask([newIndex])
      // update the moving node's parent, and get the root for saving
      const movingParent = this.movingNode.parentElement
      const movingRoot = movingParent.getRootNode().task
      movingParent.deleteSub(this.movingNode.task)
      movingParent.updateSubPaths()
      // get all tasks from base, replace moving root and insert new root
      this.base.mapSave((tasks) => {
        // replace the parent node with the updated one
        const movingIndex = tasks.findIndex((task) => task.id === movingRoot.id)
        tasks.splice(movingIndex, 1, movingRoot)
        // insert the moving node as a root (promotes to root in base)
        tasks.splice(newIndex, 0, newTask)
        // update all paths
        tasks.forEach((sub, index) => {
          sub.path = [index]
          // helper function
          movingParent.updateTreePaths(sub)
        })
        return tasks
      })
    }

    // dropping below another node makes it its next sibling
    // dropping it above another node makes it its previous sibling
    if (this.placement === 'above' || this.placement === 'below') {
      if (this.underNode.isRoot()) {
        // placing a node above or below a root node
        if (this.movingNode.isRoot()) {
          // scenario: reordering root nodes
          this.base.mapSave((tasks) => {
            // find moving node index
            const movingIndex = tasks.findIndex((task) => task.id === this.movingNode.task.id)
            // reordering of root nodes
            const movingTask = tasks.splice(movingIndex, 1)[0]
            const underIndex = tasks.findIndex((task) => task.id === this.underNode.task.id)
            const newIndex = this.placement === 'above' ? underIndex : underIndex + 1
            tasks.splice(newIndex, 0, movingTask)
            // normalize paths
            tasks.forEach((sub, index) => {
              sub.path = [index]
              // helper function
              this.movingNode.updateTreePaths(sub)
            })
            // update all paths
            return tasks
          })
        } else {
          // scenario: a branch node is promoted to root node
          // update the moving node's parent, and get the root for saving
          const movingParent = this.movingNode.parentElement
          const movingRoot = movingParent.getRootNode().task
          movingParent.deleteSub(this.movingNode.task)
          movingParent.updateSubPaths()
          // get all tasks from base, replace moving root and insert new root
          this.base.mapSave((tasks) => {
            // replace the parent node with the updated one
            const parentIndex = tasks.findIndex((task) => task.id === movingRoot.id)
            tasks.splice(parentIndex, 1, movingRoot)
            // find under node index in task list
            const underIndex = tasks.findIndex((task) => task.id === this.underNode.task.id)
            // insert the moving node as a root (promotes to root in base)
            const newIndex = this.placement === 'above' ? underIndex : underIndex + 1
            const newTask = this.movingNode.graftTask([newIndex])
            tasks.splice(newIndex, 0, newTask)
            // update all paths
            tasks.forEach((sub, index) => {
              sub.path = [index]
              // helper function
              movingParent.updateTreePaths(sub)
            })
            return tasks
          })
        }
        // cleanup
        this.underNode.classList.remove('over')
        this.underNode.querySelector('span').classList.remove('drag-above')
        this.underNode.querySelector('span').classList.remove('drag-below')
        return
      }
      const underParent = this.underNode.parentElement
      const underPosition = this.underNode.task.path[this.underNode.task.path.length - 1]
      // update dragging item path
      const newPosition = this.placement === 'above' ? underPosition : underPosition + 1
      underParent.graftNode(this.movingNode, newPosition)
      // save and delete
      underParent.save()
      this.movingNode.delete()
      // cleanup
      this.underNode.querySelector('span').classList.remove('drag-above')
      this.underNode.querySelector('span').classList.remove('drag-below')
    }

    // dropping on top of another node makes it its child
    if (this.placement === 'center') {
      // open the destination node
      this.underNode.task.meta.opened = true
      // graft, save, and delete
      this.underNode.graftNode(this.movingNode)
      this.underNode.save()
      this.movingNode.delete()
      // cleanup
      this.underNode.querySelector('span').classList.remove('drag-center')
    }

    // cleanup
    this.underNode.classList.remove('over')
    this.movingNode = null
    this.underNode = null
    this.placement = null
  }

  dragOver(event) {
    event.stopPropagation()
    event.preventDefault()
    // dragging over task-base (empty space)
    if (event.target.tagName === TAG_BASE.toUpperCase()) {
      // dropping a root node on task-base does nothing
      if (!this.movingNode.isRoot()) {
        this.placement = 'root'
      } else {
        this.placement = null
      }
      // cleanup
      const underTag = this.underNode?.querySelector('span')
      if (underTag) {
        underTag.classList.remove('drag-above')
        underTag.classList.remove('drag-below')
        underTag.classList.remove('drag-center')
      }
      return
    }

    let node = null
    // when the under node is task-node
    if (event.target.tagName === TAG_NODE.toUpperCase()) {
      node = event.target
    }
    // when the under node is  task-name, get the task-node
    if (event.target.getAttribute('slot') === NAME_NAME) {
      node = event.target.parentElement
    }
    // when the under node is not the node being dragged
    if (node && !this.movingNode.equals(node) && !node.equals(this.underNode)) {
      // remove previous under node class
      if (this.underNode) {
        this.underNode.classList.remove('over')
      }
      // cache the under node
      this.underNode = node
      this.underNode.classList.add('over')
    }

    // cache mouse vertical movement
    if (!this.mouseY || this.mouseY !== event.clientY) {
      this.mouseY = event.clientY
    }

    if (!this.underNode) {
      return
    }

    // get bounding boxes of dragging node and unerneath node
    const underTag = this.underNode.querySelector('span')
    const movingTag = this.movingNode.querySelector('span')
    const underBox = underTag.getBoundingClientRect()
    const movingBox = movingTag.getBoundingClientRect()

    // when the dragging node is above the under node
    if (this.mouseY < underBox.top + movingBox.height && this.mouseY > underBox.top) {
      this.placement = 'above'
      underTag.classList.remove('drag-center')
      underTag.classList.remove('drag-below')
      underTag.classList.add('drag-above')
      return
    }

    // when the dragging node is below the under node
    if (this.mouseY > underBox.bottom - movingBox.height && this.mouseY < underBox.bottom) {
      this.placement = 'below'
      underTag.classList.remove('drag-above')
      underTag.classList.remove('drag-center')
      underTag.classList.add('drag-below')
      return
    }

    // when the dragging node overlaps with under node
    if (
      this.mouseY > underBox.top + movingBox.height &&
      this.mouseY < underBox.bottom - movingBox.height
    ) {
      this.placement = 'center'
      underTag.classList.remove('drag-above')
      underTag.classList.remove('drag-below')
      underTag.classList.add('drag-center')
      return
    }
  }

  getNode(task) {
    if (!task) {
      // if no task, return the focused task
      return this.querySelector(`${TAG_NODE}[${DATA_FOCUS}]`)
    }

    let query = ''
    if (task.id) {
      query = `${TAG_NODE}[${DATA_ID}="${task.id}"]`
    } else {
      query = `${TAG_NODE}[${DATA_PATH}="${task.path.toString()}"]`
    }

    return this.querySelector(query)
  }

  getRootNodes() {
    return this.querySelectorAll(`${TAG_BASE} > ${TAG_NODE}`)
  }

  transformTask(task, transform) {
    const traverseTask = (task, transform) => {
      transform(task)
      if (!task.tree.length) return

      task.tree.forEach((sub) => {
        traverseTask(sub, transform)
      })
      return task
    }

    return traverseTask(task, transform)
  }
}
