require "rubygems"
require "bundler"
Bundler.require

require 'cucumber/formatter/unicode'
require 'capybara/dsl'

Capybara.app = Rack::Builder.new do
  map "/" do
    use Rack::Static, :urls => ["/"]
    run lambda {|env| [404, {}, '']}
  end
end.to_app

require 'capybara/cucumber'
require 'capybara/session'

Capybara.default_selector = :css
Capybara.default_driver = :selenium

Before do
  visit '/public/integration/midas.html'
end

