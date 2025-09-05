class TaskFocus extends HTMLDialogElement {
  seed = null

  constructor() {
    super()
  }

  connectedCallback() {
    const focusTemplate = document.getElementById(TEMPLATE_FOCUS)
    this.append(focusTemplate.content.cloneNode(true))
    this.bindEvents()
  }

  bindEvents() {
    // focus exit
    this.addEventListener('close', (event) => {
      event.stopPropagation()
      const node = this.parentElement.queryNode()
      node.blurNode()
    })

    // focus exit
    this.querySelector(`[name="${NAME_PAUSE}"]`).addEventListener('click', (event) => {
      event.stopPropagation()
      // pause current task
      const node = this.parentElement.queryNode()
      node.pause()

      let parent = node.parentElement
      if (!parent.task) {
        return this.hideFocus()
      }
      // pause parent
      if (parent.isActive()) {
        parent.pause()
      }
      // pause ancestors, if active
      while (!parent.equals(this.seed) && parent.isActive()) {
        parent = parent.parentElement
        parent.pause()
      }
      // exit focus
      this.hideFocus()
    })

    // focus complete task
    this.querySelector(`[name="${NAME_DONE}"]`).addEventListener('click', (event) => {
      event.stopPropagation()
      // get current task
      const node = this.parentElement.queryNode()
      // DFS - get first subtask
      let nextNode = node.querySelector(TAG_NODE)

      node.blurNode()

      // no subtasks
      if (!nextNode) {
        // task is done
        node.complete()
        // focus level ~ leaf task
        let parent = node.parentElement
        // current task is initial focus (no more subtasks left)
        // or current task is a root task with no subtasks
        if (node.equals(this.seed) || node.isRoot()) {
          node.complete()
          return this.hideFocus()
        }

        // try adjacent task
        nextNode = node.nextSibling
        // no adjacent tasks
        if (!nextNode) {
          // parent is done
          parent.complete()
          // focus level ~ singleton leaf task
          // parent task is the initial focus (last subtask of the branch)
          // or parent task is a root task
          if (parent.equals(this.seed) || parent.isRoot()) {
            return this.hideFocus()
          }
          // try uncle task
          nextNode = parent.nextSibling
        }

        // no direct uncle task
        // focus level ~ deep leaf task
        while (!nextNode) {
          // get next valid ancestor
          parent = parent.parentElement
          // ancestor is done
          parent.complete()
          // quit if visited ancestor is the initial focus task
          if (parent.equals(this.seed)) {
            return this.hideFocus()
          }
          // valid ancestor relative found
          nextNode = parent.nextSibling
        }
      }

      nextNode.focusNode()
      this.renderFocus(nextNode.task)
    })
  }

  hideFocus() {
    const node = this.parentElement.queryNode(this.seed.task)
    node.scrollIntoView({ behavior: 'smooth' })

    this.close()
    // cleanup
    this.seed = null
    // this.querySelectorAll('ul li').forEach((taskName) => taskName.remove())
    this.querySelector('header h1').remove()
    document.querySelector('main').classList.remove(CLASS_FOCUS)
  }

  renderFocus(task) {
    // const dialog = this.querySelector('dialog')
    const focusTitleEl = this.querySelector('header h1')
    const focusNoteEl = this.querySelector('header p')

    if (focusTitleEl) {
      const focusTaskName = focusTitleEl.textContent
      focusTitleEl.textContent = task.name
      // completed task list
      // const taskName = document.createElement('li')
      // taskName.setAttribute('slot', NAME_NAME)
      // taskName.textContent = focusTaskName
      // this.querySelector('ul').prepend(taskName)
    } else {
      const focusTitle = document.createElement('h1')
      focusTitle.setAttribute('slot', 'task-focus-name')
      focusTitle.textContent = task.name
      this.querySelector('header').prepend(focusTitle)
    }

    if (focusNoteEl) {
      focusNoteEl.textContent = task.note
    } else {
      const focusNote = document.createElement('p')
      focusNote.setAttribute('slot', 'task-focus-note')
      focusNote.textContent = task.note
      this.querySelector('header').appendChild(focusNote)
    }
  }

  showFocus(node) {
    document.querySelector('main').classList.add(CLASS_FOCUS)
    // cache initial task
    this.seed = node

    this.renderFocus(node.task)
    this.showModal()
    this.focus()
  }
}
