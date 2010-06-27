require 'rubygems'
require 'rake'
Dir[File.join(File.dirname(__FILE__), "/tasks/**/*.rake")].sort.each { |ext| load ext }

ENV['PATH'] += ':/opt/local/bin'

#require 'spec/rake/spectask'
#Spec::Rake::SpecTask.new(:spec) do |spec|
#  spec.libs << 'lib' << 'spec'
#  spec.spec_files = FileList['spec/**/*_spec.rb']
#end
#
#Spec::Rake::SpecTask.new(:rcov) do |spec|
#  spec.libs << 'lib' << 'spec'
#  spec.pattern = 'spec/**/*_spec.rb'
#  spec.rcov = true
#end
#
#task :spec => :check_dependencies
#
#task :default => :spec

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
