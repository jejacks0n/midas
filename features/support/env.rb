require "rubygems"
require "bundler"
Bundler.require

require 'cucumber/formatter/unicode'
require 'capybara/dsl'

Capybara.app = Rack::Builder.new do
  map "/" do
    use Rack::Static, :urls => ["/"], :root => "public"
    run lambda {|env| [404, {}, '']}
  end
end.to_app

require 'capybara/cucumber'
require 'capybara/session'

Capybara.default_selector = :css
Capybara.default_driver = :selenium

require 'selenium-webdriver'
class Capybara::Driver::Selenium < Capybara::Driver::Base
  def self.driver
    unless @driver
      @driver = Selenium::WebDriver.for :firefox, :profile => 'webdriver'
      at_exit do
        @driver.quit
      end
    end
    @driver
  end
end

Before do
  visit '/integration/midas.html'
end

