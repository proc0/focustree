class TaskControl extends HTMLElement {
  base = null
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

    this.addEventListener('dragend', (e) => {
      // dropping it on itself
      if (!this.underNode || this.movingNode === this.underNode) {
        // cleanup
        this.underNode?.classList.remove('over')
        this.movingNode = null
        this.underNode = null
        this.placement = null
        return
      }

      // dropping a branch on task-base to become root
      if (this.placement === 'root') {
        // get new task path (order index of root)
        const rootIndex = this.querySelectorAll('task-base > task-node').length
        const newPath = [rootIndex >= 0 ? rootIndex : 0]
        // create root task
        this.base.addRoot({
          detail: { task: this.movingNode.graftTask(newPath) },
        })
        this.movingNode.delete()
      }

      // dropping below another node makes it its next sibling
      // dropping it above another node makes it its previous sibling
      if (this.placement === 'above' || this.placement === 'below') {
        if (this.underNode.isRoot()) {
          if (this.movingNode.isRoot()) {
            this.clear()
            this.base.mapAll((tasks) => {
              tasks.sort((a, b) => {
                return a.path[0] > b.path[0] ? 1 : -1
              })
              // find moving node index
              const movingIndex = tasks.findIndex((task) => task.id === this.movingNode.task.id)
              // const newPath = [newIndex >= 0 ? newIndex : 0]
              // reordering of root nodes
              const movingTask = tasks.splice(movingIndex, 1)[0]
              const underIndex = tasks.findIndex((task) => task.id === this.underNode.task.id)
              const newIndex = this.placement === 'above' ? underIndex : underIndex + 1
              tasks.splice(newIndex, 0, movingTask)
              // normalize paths
              tasks.forEach((sub, index) => {
                sub.path = [index]
                this.movingNode.updateTreePaths(sub)
              })
              // update all paths
              return tasks
            })
          } else {
            // const underIndex = this.underNode.task.path[0]
            // const newIndex = this.placement === 'above' ? underIndex : underIndex + 1
            // const newTask = this.movingNode.graftTask([newIndex])
            this.movingNode.parentElement.deleteSub(this.movingNode.task)
            this.movingNode.parentElement.updateSubPaths()
            const movingRoot = this.movingNode.parentElement.getRootNode().task

            this.clear()
            // branch node promotion to root and reorder
            this.base.mapAll((tasks) => {
              tasks.sort((a, b) => {
                return a.path[0] > b.path[0] ? 1 : -1
              })
              const parentIndex = tasks.findIndex((task) => task.id === movingRoot.id)
              tasks.splice(parentIndex, 1, movingRoot)
              const underIndex = tasks.findIndex((task) => task.id === this.underNode.task.id)
              const newIndex = this.placement === 'above' ? underIndex : underIndex + 1
              const newTask = this.movingNode.graftTask([newIndex])
              tasks.splice(newIndex, 0, newTask)
              // update all paths
              tasks.forEach((sub, index) => {
                sub.path = [index]
                this.movingNode.updateTreePaths(sub)
              })
              return tasks
            })
          }
          // this.movingNode.delete()
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

      // dropping on top of another task makes it its child
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
    })

    // drag over

    this.addEventListener('dragover', (e) => {
      e.preventDefault()
      // dragging over task-base (empty space)
      if (e.target.tagName === TAG_BASE.toUpperCase()) {
        this.placement = 'root'
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
      if (e.target.tagName === TAG_NODE.toUpperCase()) {
        node = e.target
      }
      // when the under node is  task-name, get the task-node
      if (e.target.getAttribute('slot') === NAME_NAME) {
        node = e.target.parentElement
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
      if (!this.mouseY || this.mouseY !== e.clientY) {
        this.mouseY = e.clientY
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
    })
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
