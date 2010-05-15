require 'rubygems'
require 'rake'
Dir[File.join(File.dirname(__FILE__), "/tasks/**/*.rake")].sort.each { |ext| load ext }

ENV['PATH'] += ':/opt/local/bin'

begin
  require 'jeweler'
  Jeweler::Tasks.new do |gem|
    gem.name = "midas"
    gem.summary = %Q{A rich text editor gem for Rails}
    gem.description = %Q{Provides a front end for editing content in a contextual way with WYSIWYG editing}
    gem.email = "jejacks0n@gmail.com"
    gem.homepage = "http://github.com/jejacks0n/midas"
    gem.authors = ["Jeremy Jackson"]
    gem.add_dependency "packr", ">= 3.1.0"
    gem.add_development_dependency "rspec", ">= 1.3.0"
    gem.add_development_dependency "jasmine", ">= 0.10.3.5"
    # gem is a Gem::Specification... see http://www.rubygems.org/read/chapter/20 for additional settings
  end
  Jeweler::GemcutterTasks.new
rescue LoadError
  puts "Jeweler (or a dependency) not available. Install it with: gem install jeweler"
rescue Git::GitExecuteError
  puts "Unable to locate git in your path. If you have git installed, and it's not being found, edit this Rakefile and adjust the ENV['PATH']"
end

require 'spec/rake/spectask'
Spec::Rake::SpecTask.new(:spec) do |spec|
  spec.libs << 'lib' << 'spec'
  spec.spec_files = FileList['spec/**/*_spec.rb']
end

Spec::Rake::SpecTask.new(:rcov) do |spec|
  spec.libs << 'lib' << 'spec'
  spec.pattern = 'spec/**/*_spec.rb'
  spec.rcov = true
end

task :spec => :check_dependencies

task :default => :spec

require 'rake/rdoctask'
Rake::RDocTask.new do |rdoc|
  version = File.exist?('VERSION') ? File.read('VERSION') : ""

  rdoc.rdoc_dir = 'rdoc'
  rdoc.title = "midas #{version}"
  rdoc.rdoc_files.include('README*')
  rdoc.rdoc_files.include('lib/**/*.rb')
end

namespace :jasmine do
  task :require do
    require 'jasmine'
  end

  desc "Run continuous integration tests"
  task :ci => "jasmine:require" do
    require "spec"
    require 'spec/rake/spectask'

    Spec::Rake::SpecTask.new(:jasmine_continuous_integration_runner) do |t|
      t.spec_opts = ["--color", "--format", "specdoc"]
      t.verbose = true
      t.spec_files = ['spec/javascripts/support/jasmine_runner.rb']
    end
    Rake::Task["jasmine_continuous_integration_runner"].invoke
  end

  task :server => "jasmine:require" do
    jasmine_config_overrides = 'spec/javascripts/support/jasmine_config.rb'
    require jasmine_config_overrides if File.exists?(jasmine_config_overrides)

    puts "your tests are here:"
    puts "  http://localhost:8888/"

    Jasmine::Config.new.start_server
  end
end

desc "Run specs via server"
task :jasmine => ['jasmine:server']
