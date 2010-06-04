//  getTextNodes: function(fragment, textnodes) {
//    textnodes = textnodes || [];
//    Element.cleanWhitespace(fragment);
//
//    for (var i = 0; i <= fragment.childNodes.length - 1; ++i) {
//      if (fragment.childNodes[i].nodeType == 3) {
//        textnodes.push(fragment.childNodes[i]);
//      } else {
//        this.getTextNodes(fragment.childNodes[i], textnodes);
//      }
//    }
//    return textnodes;
//  },
//    insertElement: function(callback) {
//      var element = callback.call(this);
//      this.selections.each(function(selection) {
//        selection.deleteContents();
//        selection.insertNode(element);
//        selection.selectNode(element);
//      });
//    },

//    classname: function(classname) {
//      this.selections.each(function(selection) {
//        var fragment = selection.cloneContents();
//        var textnodes = this.getTextNodes(fragment);
//
//        console.debug(selection);
//        console.debug(fragment);
//
//        // get the container node
//        // this should be prototyped on element/range for better testing
//        var container;
//        if (selection.commonAncestorContainer.nodeType == 3) { // common ancestor is a text node
//          container = selection.commonAncestorContainer.parentNode;
//        } else {
//          container = selection.commonAncestorContainer;
//        }
//
//        console.debug('container', container);
//
//        console.debug('container', container.childNodes);
//        console.debug('fragment', fragment.childNodes);
//
//        if (container != this.element) {
//          if (!container.childNodes.equals(fragment.childNodes)) {
//            // the node is not the fragment
//            if (fragment.childNodes.length == 1 && fragment.childNodes[0].nodeType != 3) {
//              // the fragment has one child and it's not a text node
//              console.debug('first node');
//              container = fragment.childNodes[0];
//              selection.deleteContents();
//              selection.insertNode(container);
//              selection.selectNode(container);
//            }
//          }
//          container.addClassName(classname)
//        } else {
//          // the nodes should be wrapped within one span
//          // ... and cleanup should be done
//          console.debug('new');
//          selection.surroundContents(new Element('span', {'class': classname}));
//        }
//
//        // selecting 's' in 'testing', should be: span
//        // selecting 'testing', should be: div
//        // selecting 'Ipsum...', should be: [region]
//        // selecting 'Ipsum... testing', should be: [region]
//        // selecting everything, should be: [region]
//        // selecting 'tr2td2', should be: td
//        // selecting the table cell containing 'tr2td2', should be: td
//        console.debug('container', container);
//
//        // bugs:
//        // if you select all of the cells in the table, and click italicize, and then bold.. ugh.
//
//
//
//
////        // figure out if we should add or remove
////        var count = 0;
////        textnodes.each(function(node) {
////          if (node.parentNode != fragment && Element.hasClassName(node.parentNode, classname)) count = count + 1;
////        });
////
////        if (count == 0 || count < textnodes.length - 1) {
////          // add
////          textnodes.each(function(node) {
////            console.debug(node, node.parentNode);
////            if (node.parentNode != fragment) {
////              Element.addClassName(node.parentNode, classname);
////            } else {
////              Element.wrap(node, new Element('span', {'class': classname}));
////            }
////          });
////        } else {
////          console.debug('remove');
////          // remove
////
////          // only remove span tags, if it doesn't have any attributes,
////          // otherwise remove the classname, and if the class attribute is empty remove that too
////
////          textnodes.each(function(node) {
////            if (node.parentNode != fragment) {
////              Element.removeClassName(node.parentNode, classname);
////            }
////          });
////        }
////
//      }.bind(this));
//    }
