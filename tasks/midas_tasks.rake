require 'packr'
require 'base64'

javascript_files = %w[native_extensions midas region toolbar statusbar dialog palette select panel modal]
stylesheet_files = %w[midas region toolbar statusbar dialog palette select panel modal]

namespace :midas do
  desc "Build midas into the distro"
  task :build => [:minify_js, :bundle_css] do

  end

  desc "Combine, minify, and pack development js files into midas.js and midas.min.js"
  task :minify_js do
    thisfile = File.dirname(__FILE__)
    output_path = "#{thisfile}/../public/javascripts"
    input_path = "#{thisfile}/../public/javascripts/midas"

    code = ''
    config_code = File.read("#{input_path}/config.js")
    javascript_files.each do |file|
      code << File.read("#{input_path}/#{file}.js")
    end

    File.open("#{output_path}/midas.js", 'wb') { |file| file.write(code + config_code) }
    File.open("#{output_path}/midas.min.js", 'wb') do |file|
      file.write(Packr.pack(code, :base62 => true) + ";\n" + config_code)
    end
  end

  desc "Combine stylesheets into midas.css and midas.min.css (bundling image assets where possible)"
  task :bundle_css do
    thisfile = File.dirname(__FILE__)
    output_path = "#{thisfile}/../public/stylesheets"
    input_path = "#{thisfile}/../public/stylesheets/midas"

    code = ''
    stylesheet_files.each do |file|
      code << File.read("#{input_path}/#{file}.css")
    end

    File.open("#{output_path}/midas.css", 'wb') { |file| file.write(code) }
    File.open("#{output_path}/midas.bundle.css", 'wb') do |file|
      # import image files using: url(data:image/gif;base64,XEQA7)
      code.gsub!(/url\(\.\.\/\.\.(.*)\)/ix) do |m|
        encoded = Base64.encode64(File.read("#{thisfile}/../public#{$1}")).gsub("\n", '')
        encoded.size > 32 * 1024 ? "url(..#{$1})" : "url(data:image/png;base64,#{encoded})"
      end
      # remove comments (only /* */ style)
      code.gsub!(/\/?\*[-| ].*\/?/, '')
      # remove whitespace
      code.gsub!(/\s+/, ' ')
      # put a few line breaks back in
      code.gsub!(/\}/, "}\n")
      # remove more whitespace
      code.gsub!(/^\s+/, '')
      file.write(code)
    end
  end

end
