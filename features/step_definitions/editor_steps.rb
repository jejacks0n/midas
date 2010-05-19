

When /^(?:|I)click into the editable area(?: (within .*))?$/ do |selector|
  with_scope(selector) do
   editable = find("div.editable")
   editable.click
   editable.node.send_keys 'f u you f\'n bastard'
  end
end

When /I debug/i do
  require 'ruby-debug'
  debugger
  true
end

