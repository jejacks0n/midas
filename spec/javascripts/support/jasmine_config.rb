module Jasmine
  class Config

    alias :original_js_files :js_files
    def js_files(spec_filter)
      generate_fixtures
      original_js_files spec_filter
    end

    def generate_fixtures
      FileUtils.cd File.join(spec_dir, 'fixtures') do
        File.open 'fixtures.js', 'w' do |js_file|

          # import html files
          js_file.write %Q{jasmine.fixtures = {};\n}
          Dir['*.html'].each do |filename|
            js_file.write %Q{jasmine.fixtures['#{filename.sub(/\.html$/, '')}'] = "}
            File.foreach filename do |line|
              js_file.write line.chomp.gsub('"', '\\"')
            end
            js_file.write %Q{";\n\n}
          end

          # import css files
          js_file.write %Q{\njasmine.css = {};\n}
          Dir['*.css'].each do |filename|
            js_file.write %Q{jasmine.css['#{filename.sub(/\.css$/, '')}'] = "}
            File.foreach filename do |line|
              js_file.write line.chomp.gsub('"', '\\"')
            end
            js_file.write %Q{";\n\n}
          end

        end
      end
    end

  end
end
