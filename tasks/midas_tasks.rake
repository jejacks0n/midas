require 'packr'

def copy(filename, from_dir, to_dir)
  from = File.expand_path(File.join(from_dir, filename))
  to = File.expand_path(File.join(to_dir, filename))

  if File.exist?(File.expand_path(to_dir))
    puts "   exists: #{to_dir}"
  else
    puts " creating: #{to_dir}"
    FileUtils.mkdir(to_dir)
  end

  if File.exist?(to)
    puts "   exists: #{to}"
  else
    puts " creating: #{to}"
    FileUtils.cp(from, to)
  end
end

namespace :midas do
  desc "Install midas into your project"
  task :install => [:minify_js, :copy_assets] do
    
  end

  desc "Combine, minify, and pack all the development files into one midas.js, and one midas.min.js file"
  task :minify_js do
    code = '';
    output_path = File.join(File.dirname(__FILE__), '/../public/javascripts')
    %w[native_extensions midas region toolbar statusbar dialog].each do |file|
      code << File.read(File.join(File.dirname(__FILE__), "/../public/javascripts/midas/#{file}.js"))
    end
    config = File.read(File.join(File.dirname(__FILE__), "/../public/javascripts/midas/config.js"))
    File.open(File.join(output_path, 'midas.js'), 'wb') { |file| file.write(code + config) }
    File.open(File.join(output_path, 'midas.min.js'), 'wb') { |file| file.write(Packr.pack(code, :base62 => true) + ";\n" + config) }
  end

  task :copy_assets do
    raise 'This task expects a RAILS_ROOT variable.' unless RAILS_ROOT

    %w[images/* stylesheets/*.css javascripts/*.js].each do |path|
      Dir[File.join(File.dirname(__FILE__), "/../public/#{path}")].sort.each do |filename|
        to = File.join(RAILS_ROOT, 'public', File.dirname(path))
        copy(File.basename(filename), File.dirname(filename), to)
      end
    end
  end
end

