

When /^(?:|I)click into the editable area(?: (within .*))?$/ do |selector|
  with_scope(selector) do
   editable = find("div.editable")
   editable.click
   editable.node.send_keys "you little bugger, you're editable!"
  end
end

When /I debug/i do
  require 'ruby-debug'
  debugger
  true
end

