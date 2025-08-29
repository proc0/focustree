const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

const QUERY_FOCUS_NODE = 'task-node[data-focused]'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.addEventListener(EVENT_RENDER, this.renderBranch.bind(this))
    this.addEventListener(EVENT_REROOT, this.renderRoot.bind(this))
    this.addEventListener(EVENT_REFRESH, this.refresh.bind(this))
    this.addEventListener(EVENT_DELETE, this.deleteTree.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focusTree.bind(this))
    this.addEventListener(EVENT_EDIT, this.renderBranch.bind(this))
    this.addEventListener(EVENT_MENU, this.showMenu.bind(this))
    this.addEventListener(EVENT_EXPAND, this.hideMenu.bind(this))

    // dragging

    this.movingNode = null
    this.underNode = null
    this.placement = null
    this.mouseY = null

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
        this.querySelector('task-base').addRoot({
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
            this.querySelector('task-base').mapAll((tasks) => {
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
            this.querySelector('task-base').mapAll((tasks) => {
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
      if (node && !this.movingNode.equals(node) && this.underNode !== node) {
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

  clear() {
    this.querySelectorAll(TAG_NODE).forEach((node) => {
      node.remove()
    })
  }

  deleteTree({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  focusTree(event) {
    const initialTask = event.target
    // focus initial task
    initialTask.focus()
    // show focus modal
    this.querySelector('dialog').showFocus(initialTask)
    // custom scroll into view, places the focused task slightly above center
    const taskContainer = initialTask.select('div').getBoundingClientRect()
    const containerY = taskContainer.top + window.pageYOffset
    const middle = containerY - window.innerHeight / 2 + 200
    window.scrollTo(0, middle)
  }

  getNode(task) {
    if (!task) {
      // if no task, return the focused task
      return this.querySelector(QUERY_FOCUS_NODE)
    }

    const taskId = task.id
    const taskPath = task.path.toString()

    let node = null
    if (taskId) {
      node = this.querySelector(`task-node[data-id="${taskId}"]`)
    } else {
      node = this.querySelector(`task-node[data-path="${taskPath}"]`)
    }

    return node
  }

  hideMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').hide()
  }

  refresh({ detail }) {
    const tasks = detail.tasks

    tasks.sort((a, b) => {
      return a.path[0] > b.path[0] ? 1 : -1
    })

    tasks.forEach((task) => {
      this.renderRoot({ detail: { task }, target: this.querySelector('task-base') })
    })
  }

  renderBranch({ detail, target }) {
    const task = detail.task
    const treeNode = this.renderTree(task)
    // branch rendering
    treeNode.setAttribute('slot', NAME_TREE)
    // replace node with updated node
    detail.node.replaceWith(treeNode)
  }

  // TODO: add render method for lists of tasks
  // could be a different method or this one
  renderRoot({ detail, target }) {
    const task = detail.task
    const treeNode = this.renderTree(task)
    target.appendChild(treeNode)
  }

  renderSelect(task) {
    const taskState = document.createElement('select')
    taskState.setAttribute('slot', NAME_STATE)
    // let currentState = ''
    task.data.states.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state.toUpperCase()
      // set current state
      if (index === task.state) {
        // currentState = state
        option.setAttribute('selected', '')
        taskState.value = index
      }
      taskState.appendChild(option)
    })
    // set class to current state name
    // taskState.classList.add(currentState)
    return taskState
  }

  renderTree(task) {
    const taskNode = document.createElement(TAG_NODE).init(task)
    const container = taskNode.shadowRoot.querySelector('div')

    // metadata
    taskNode.setAttribute('data-path', task.path)
    if (task.id) {
      // only root tasks have id
      taskNode.setAttribute('data-id', task.id)
    }
    taskNode.setAttribute('draggable', 'true')

    // task name
    if (taskNode.selectName(NAME_NAME)) {
      const taskName = document.createElement(TAG_FIELD)
      taskName.setAttribute('slot', NAME_NAME)
      const treeLength = task.tree.length
      // subtask number
      if (task.meta.editing || !treeLength) {
        taskName.textContent = task.name
      } else {
        taskName.textContent = `${task.name} (${treeLength})`
      }
      // note tooltip
      if (task.note.length) {
        taskName.setAttribute('title', task.note)
      }
      taskNode.appendChild(taskName)
    }

    // edit mode
    if (task.meta.editing) {
      // task note
      if (task.note.length) {
        const taskNote = document.createElement(TAG_FIELD)
        taskNote.setAttribute('slot', NAME_NOTE)
        taskNote.textContent = task.note
        taskNode.appendChild(taskNote)
      }
      // task state
      const taskState = this.renderSelect(task, taskNode)
      taskNode.appendChild(taskState)
      // add edit class
      container.classList.add('editing')
    }

    // state class and attributes on container
    const currentState = task.data.states[task.state].toLowerCase()
    container.classList.add(currentState)

    // focus mode
    if (task.meta.focused) {
      taskNode.setAttribute('data-focused', '')
      container.classList.add('focused')
    }

    // refresh menu task node
    const menu = this.querySelector('menu')
    if (menu.node?.equals(taskNode)) {
      menu.node = taskNode
    }

    // leaf node
    if (!task.tree.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch node
    container.classList.add(CLASS_BRANCH)

    // subtasks title header
    const treeTitleSlot = taskNode.selectName(NAME_TITLE_TREE)
    if (treeTitleSlot && task.meta.editing) {
      const treeLabel = document.createElement(TAG_LABEL)
      const treeLength = task.tree.length
      treeLabel.setAttribute('slot', NAME_TITLE_TREE)
      treeLabel.textContent = `${treeTitleSlot.getAttribute('data-text')} (${treeLength})`
      taskNode.appendChild(treeLabel)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    for (let i = 0; i < task.tree.length; i++) {
      // recurse tree
      const subTree = this.renderTree(task.tree[i])
      subTree.setAttribute('slot', NAME_TREE)
      // append tree
      taskNode.appendChild(subTree)
    }

    return taskNode
  }

  showMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').show(event)
  }
}
