//@ts-check
//@ts-ignore
define(() => {
    //@ts-check
    'use strict';

    const attr_draggable = 'draggable';
    const element_wrapper_class = 'reorderable-list-element';
    const data_element_index = 'elementIndex';
    const data_dragState = 'dragState';
    const data_dropTargetState = 'dropTargetState';
    const dropTargetState = { none: 'none', over: 'over' };
    const dragstate = { none: 'none', dragging: 'dragging' };

    class ReorderableList {
        #element;
        /**
         * @param {HTMLElement} element
         */
        constructor(element) {
            this.#element = element;
        }
        get elements() {
            return [...this.#element.children].map(e => e.children[0]);
        }

        /**
         * @param {string | Node} item
         */
        append(item) {
            this.#element.append(item);
        }
    }

    class ReorderEvent extends Event {
        static get TYPE() {
            return 'reorderable-list-reorder';
        }
        constructor() {
            super(ReorderEvent.TYPE);
        }
    }

    /**
     * @param {HTMLElement} element
     */
    function create(element, options = { collectChildren: false }) {
        element.classList.add('reorderable-list');
        if (options.collectChildren) {
            init(element);
        } else {
            element.innerHTML = '';
        }

        const observer = new MutationObserver(() => {
            init(element);
            element.dispatchEvent(new ReorderEvent());
        });

        observer.observe(element, { childList: true });
        return new ReorderableList(element);

        function isInSameList(/** @type {EventTarget | null} */ target) {
            if (!(target instanceof Element)) {
                return false;
            }
            return target.parentElement === element;
        }

        function initChild(/** @type {Element} */ child, /** @type {number} */ index) {
            child.remove();
            const wrapper = document.createElement('div');
            wrapper.classList.add(element_wrapper_class);
            wrapper.setAttribute(attr_draggable, 'true');
            wrapper.append(child);
            wrapper.dataset[data_dragState] = dragstate.none;
            wrapper.dataset[data_dropTargetState] = dropTargetState.none;
            wrapper.dataset[data_element_index] = `${index}`;
            wrapper.addEventListener('dragstart', (event) => {
                wrapper.dataset[data_dragState] = dragstate.dragging;
                if (!event.dataTransfer) {
                    return;
                }
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plaintext', wrapper.dataset[data_element_index] ?? '');
            });
            wrapper.addEventListener('dragend', () => {
                wrapper.dataset[data_dragState] = dragstate.none;
            });
            wrapper.addEventListener('dragenter', (event) => {
                if (!isInSameList(event.currentTarget)) {
                    return;
                }
                if (!event.dataTransfer) {
                    return;
                }
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                wrapper.dataset[data_dropTargetState] = dropTargetState.over;
            });
            wrapper.addEventListener('dragleave', (event) => {
                if (event.relatedTarget instanceof Node && wrapper.contains(event.relatedTarget)) return;
                wrapper.dataset[data_dropTargetState] = dropTargetState.none;
            });
            wrapper.addEventListener('dragover', (event) => {
                if (wrapper.dataset[data_dropTargetState] !== dropTargetState.over) {
                    return;
                }
                event.preventDefault();
            });
            wrapper.addEventListener('drop', (event) => {
                wrapper.dataset[data_dropTargetState] = dropTargetState.none;
                const srcIndex = parseInt(event.dataTransfer?.getData('text/plaintext') ?? '');
                const dstIndex = parseInt(wrapper.dataset[data_element_index] ?? '');
                const src = element.children[srcIndex];

                if (srcIndex < dstIndex) {
                    wrapper.after(src);
                }

                if (srcIndex > dstIndex) {
                    wrapper.before(src);
                }
            });
            element.append(wrapper);
        }

        function updateChild(/** @type {HTMLElement} */ child, /** @type {number} */ index) {
            child.dataset[data_element_index] = `${index}`;
        }

        /**
         * @param {HTMLElement} element
         */
        function init(element) {
            const children = [...element.children];
            for (var i = 0; i < children.length; ++i) {
                const child = /** @type {HTMLElement} */(children[i]);
                if (child.classList.contains(element_wrapper_class)) {
                    updateChild(child, i);
                } else {
                    initChild(child, i);
                }
            }
        }
    }

    return {
        events: {
            ReorderEvent,
        },
        ReorderableList,
        create,
    };
});