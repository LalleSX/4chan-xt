Quotify =
  init: ->
    return if g.VIEW not in ['index', 'thread'] or !Conf['Resurrect Quotes']

    if Conf['Comment Expansion']
      ExpandComment.callbacks.push @node

    Post.callbacks.push
      name: 'Resurrect Quotes'
      cb:   @node

  node: ->
    for deadlink in $$ '.deadlink', @nodes.comment
      if @isClone
        if $.hasClass deadlink, 'quotelink'
          @nodes.quotelinks.push deadlink
      else
        Quotify.parseDeadlink.call @, deadlink
    return

  parseDeadlink: (deadlink) ->
    if $.hasClass deadlink.parentNode, 'prettyprint'
      # Don't quotify deadlinks inside code tags,
      # un-`span` them.
      # This won't be necessary once 4chan
      # stops quotifying inside code tags:
      # https://github.com/4chan/4chan-JS/issues/77
      Quotify.fixDeadlink deadlink
      return

    quote = deadlink.textContent
    return unless postID = quote.match(/\d+$/)?[0]
    if postID[0] is '0'
      # Fix quotelinks that start with a `0`.
      Quotify.fixDeadlink deadlink
      return
    boardID = if m = quote.match /^>>>\/([a-z\d]+)/
      m[1]
    else
      @board.ID
    quoteID = "#{boardID}.#{postID}"

    if post = g.posts[quoteID]
      unless post.isDead
        # Don't (Dead) when quotifying in an archived post,
        # and we know the post still exists.
        a = $.el 'a',
          href:        Build.postURL boardID, post.thread.ID, postID
          className:   'quotelink'
          textContent: quote
      else
        # Replace the .deadlink span if we can redirect.
        a = $.el 'a',
          href:        Build.postURL boardID, post.thread.ID, postID
          className:   'quotelink deadlink'
          textContent: "#{quote}\u00A0(Dead)"
        $.extend a.dataset, {boardID, threadID: post.thread.ID, postID}

    else
      redirect = Redirect.to 'thread', {boardID, threadID: 0, postID}
      fetchable = Redirect.to 'post', {boardID, postID}
      if redirect or fetchable
        # Replace the .deadlink span if we can redirect or fetch the post.
        a = $.el 'a',
          href:        redirect or 'javascript:;'
          className:   'deadlink'
          textContent: "#{quote}\u00A0(Dead)"
        if fetchable
          # Make it function as a normal quote if we can fetch the post.
          $.addClass a, 'quotelink'
          $.extend a.dataset, {boardID, postID}

    @quotes.push quoteID unless quoteID in @quotes

    unless a
      deadlink.textContent = "#{quote}\u00A0(Dead)"
      return

    $.replace deadlink, a
    if $.hasClass a, 'quotelink'
      @nodes.quotelinks.push a

  fixDeadlink: (deadlink) ->
    if not (el = deadlink.previousSibling) or el.nodeName is 'BR'
      green = $.el 'span',
        className: 'quote'
      $.before deadlink, green
      $.add green, deadlink
    $.replace deadlink, [deadlink.childNodes...]
