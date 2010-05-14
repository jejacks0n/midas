module Jasmine
  class Config

    alias :original_js_files :js_files
    def js_files(spec_filter)
      generate_fixtures
      original_js_files spec_filter
    end

    def generate_fixtures
      FileUtils.cd File.join(spec_dir, 'fixtures') do
        File.open 'fixtures.js', 'w' do |javascript_file|
          javascript_file.write %Q{jasmine.fixtures = {};\n\n}

          Dir['*.html'].each do |html_filename|
            fixture_name = html_filename.sub /\.html$/, ''

            javascript_file.write %Q{jasmine.fixtures['#{fixture_name}'] = "}

            File.foreach html_filename do |line_of_html|
              javascript_file.write line_of_html.chomp.gsub('"', '\\"')
            end
            
            javascript_file.write %Q{";\n\n}
          end
        end
      end
    end

  end
end