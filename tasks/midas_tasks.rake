# copy assets (javascripts/stylesheets/images) into the rails project

require 'packr'

namespace :midas do
  desc "Install midas into your project"
  task :install => [:generate_js, :copy_assets] do
    
  end

  task :generate_js do
    code = '';
    files_matcher = File.join(File.dirname(__FILE__), '/../public/javascripts/midas/*.js')
    Dir[files_matcher].sort.each do |filename|
      code << File.read(filename)
    end
    File.open(File.join(File.dirname(__FILE__), '/../public/javascripts/midas.min.js'), 'wb') do |file|
      file.write(code)
    end
  end
  
  task :copy_assets do

  end
end