class TaskControl extends HTMLElement {
  base = null
  menu = null

  // dragging
  dragNode = null
  dropNode = null
  dropZone = null

  constructor() {
    super()
  }

  bindDragEvents() {
    this.addEventListener('dragstart', this.dragStart)
    this.addEventListener('touchstart', this.dragStart)
    this.addEventListener('dragover', this.dragOver)
    this.addEventListener('touchmove', this.dragOver)
    this.addEventListener('dragend', this.dragEnd)
    this.addEventListener('touchend', this.dragEnd)
  }

  clearDrag() {
    // reset drag node
    this.dragNode.removeClass(CLASS_DRAG_NODE)
    this.dragNode = null
    // reset drop node
    this.dropNode.removeClass(CLASS_DROP_HOVER)
    this.clearDropNode()
    this.dropNode = null
    // remove task view class
    this.classList.remove(CLASS_DRAGGING)
  }

  clearDropNode() {
    if (!this.dropNode) return
    this.dropNode.select('summary').classList.remove(CLASS_DROP_ABOVE)
    this.dropNode.select('summary').classList.remove(CLASS_DROP_OVER)
    this.dropNode.select('summary').classList.remove(CLASS_DROP_BELOW)
  }

  dragStart(event) {
    if (
      event.type === 'touchstart' &&
      event.target.tagName !== TAG_NODE &&
      event.target.getAttribute('slot') !== NAME_NAME
    ) {
      return
    }
    // hide task menus
    this.menu.hide()
    // get dragging target node
    const info = event.type === 'touchstart' ? event.touches[0] : event
    const target = document.elementFromPoint(info.clientX, info.clientY)
    // only drag on task name label
    const node = target?.getAttribute('slot') === NAME_NAME && target?.parentElement
    // do not drag tasks in edit mode
    if (node && !node.isEditing()) {
      this.dragNode = node
      this.dragNode.addClass(CLASS_DRAG_NODE)
      this.classList.add(CLASS_DRAGGING)
    } else if (event.type !== 'touchstart') {
      event.stopPropagation()
      // prevent dragging
      event.preventDefault()
    }
  }

  dragOver(event) {
    event.stopPropagation()
    event.preventDefault()

    if (!this.dragNode) {
      return
    }

    // get drop target node
    const info = event.type === 'touchmove' ? event.touches[0] : event
    const target = document.elementFromPoint(info.clientX, info.clientY)
    const node = target?.getAttribute('slot') === NAME_NAME && target?.parentElement
    // check if valid drop node
    if (
      node &&
      !node.select('div').classList.contains(CLASS_DROP_HOVER) &&
      !node.equals(this.dragNode) &&
      !node.isAncestor(this.dragNode)
    ) {
      // previous drop node clear
      this.dropNode?.removeClass(CLASS_DROP_HOVER)
      this.clearDropNode()
      // new node is now drop node
      this.dropNode = node
      this.dropNode.addClass(CLASS_DROP_HOVER)
    }

    if (!this.dropNode) {
      return
    }

    // get bounding boxes of task summary element
    const dropLabel = this.dropNode.select('summary')
    const dragLabel = this.dragNode.select('summary')
    const dropRect = dropLabel.getBoundingClientRect()
    const dragRect = dragLabel.getBoundingClientRect()

    this.clearDropNode()

    // when the dragging node is below the under node
    if (info.clientY > dropRect.bottom && info.clientY < dropRect.bottom + dragRect.height) {
      this.dropZone = CLASS_DROP_BELOW
      dropLabel.classList.add(CLASS_DROP_BELOW)
      return
    }
    // when the dragging node overlaps with under node
    if (info.clientY > dropRect.top && info.clientY < dropRect.bottom) {
      this.dropZone = CLASS_DROP_OVER
      dropLabel.classList.add(CLASS_DROP_OVER)
      return
    }
    // when the dragging node is above the under node
    if (info.clientY > dropRect.top - dragRect.height && info.clientY < dropRect.top) {
      this.dropZone = CLASS_DROP_ABOVE
      dropLabel.classList.add(CLASS_DROP_ABOVE)
      return
    }
  }

  dragEnd(event) {
    event.stopPropagation()

    if (!this.dragNode) {
      return
    } else if (!this.dropNode) {
      // reset drag node
      this.dragNode.removeClass(CLASS_DRAG_NODE)
      this.dragNode = null
      return
    }

    // check invalid drop target
    if (this.dropNode.equals(this.dragNode) || this.dropNode.isAncestor(this.dragNode)) {
      return this.clearDrag()
    }

    if (this.dropZone === CLASS_DROP_ABOVE || this.dropZone === CLASS_DROP_BELOW) {
      if (this.dropNode.isRoot() && this.dragNode.isRoot()) {
        // scenario: reordering root nodes
        this.base.mapSave((tasks) => {
          // find moving node index
          const dragIndex = tasks.findIndex((task) => task.id === this.dragNode.task.id)
          // reordering of root nodes
          const dragTask = tasks.splice(dragIndex, 1)[0]
          const dropIndex = tasks.findIndex((task) => task.id === this.dropNode.task.id)
          const dropPosition = this.dropZone === CLASS_DROP_ABOVE ? dropIndex : dropIndex + 1
          tasks.splice(dropPosition, 0, dragTask)
          // normalize paths
          tasks.forEach((sub, index) => {
            sub.path = [index]
            // helper function
            this.dragNode.updateTreePaths(sub)
          })
          this.clearDrag()
          // update all paths
          return tasks
        })
      } else if (this.dropNode.isRoot()) {
        // scenario: a branch node is promoted to root node
        // update the moving node's parent, and get the root for saving
        const dragParent = this.dragNode.parentElement
        const dragRoot = dragParent.getRootNode().task
        dragParent.deleteSub(this.dragNode.task)
        dragParent.updateSubPaths()
        // get all tasks from base, replace moving root and insert new root
        this.base.mapSave((tasks) => {
          // replace the parent node with the updated one
          const dragRootIndex = tasks.findIndex((task) => task.id === dragRoot.id)
          tasks.splice(dragRootIndex, 1, dragRoot)
          // find under node index in task list
          const dropIndex = tasks.findIndex((task) => task.id === this.dropNode.task.id)
          // insert the moving node as a root (promotes to root in base)
          const dropPosition = this.dropZone === CLASS_DROP_ABOVE ? dropIndex : dropIndex + 1
          const dropTask = this.dragNode.graftTask([dropPosition])
          tasks.splice(dropPosition, 0, dropTask)
          // update all paths
          tasks.forEach((sub, index) => {
            sub.path = [index]
            // helper function
            dragParent.updateTreePaths(sub)
          })

          this.clearDrag()
          return tasks
        })
      } else {
        const dropParent = this.dropNode.parentElement
        const dropIndex = this.dropNode.task.path[this.dropNode.task.path.length - 1]
        // update dragging item path
        const dropPosition = this.dropZone === CLASS_DROP_ABOVE ? dropIndex : dropIndex + 1
        dropParent.graftNode(this.dragNode, dropPosition)
        // save and delete
        dropParent.save()
        this.dragNode.delete()
        this.clearDrag()
      }
    } else if (this.dropZone === CLASS_DROP_OVER) {
      // open the destination node
      this.dropNode.task.meta.opened = true
      // graft, save, and delete
      this.dropNode.graftNode(this.dragNode)
      this.dropNode.save()
      this.dragNode.delete()
      this.clearDrag()
    } else {
      this.clearDrag()
    }
  }

  getRootNodes() {
    return this.querySelectorAll(`${TAG_BASE} > ${TAG_NODE}`)
  }

  isNode(element) {
    return element.tagName === TAG_NODE.toUpperCase() && element.task
  }

  queryNode(task) {
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

  transformTask(transform, task) {
    const traverseTask = (transform, task) => {
      transform(task)
      if (!task.tree.length) return

      task.tree.forEach((sub) => {
        traverseTask(transform, sub)
      })
      return task
    }

    return traverseTask(transform, task)
  }
}
