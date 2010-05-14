module Jasmine
  class Config
    # Rewriting this method to allow connection to a Jasmine server that's
    # already running, rather than starting one every time.  This is useful
    # for headless testing with "rake jasmine:ci".
    def start_jasmine_server
      @jasmine_server_port = external_jasmine_server_port

      if @jasmine_server_port.nil?
        @jasmine_server_port = Jasmine::find_unused_port
        server = Jasmine::Server.new(@jasmine_server_port, self)
        @jasmine_server_pid = fork do
          Process.setpgrp
          server.start
          exit! 0
        end
        puts "jasmine server started.  pid is #{@jasmine_server_pid}"
      end

      Jasmine::wait_for_listener(@jasmine_server_port, "jasmine server")
    end

    def external_jasmine_server_port
      ENV['JASMINE_SERVER_PORT'] && ENV['JASMINE_SERVER_PORT'].to_i > 0 ? ENV['JASMINE_SERVER_PORT'].to_i : nil
    end

    alias :original_js_files :js_files
    def js_files(spec_filter)
      generate_fixtures
      original_js_files spec_filter
    end

    def generate_fixtures
      FileUtils.cd File.join(spec_dir, 'fixtures') do
        File.open 'fixtures.js', 'w' do |javascript_file|
          Dir['*.html'].each do |html_filename|
            fixture_name = html_filename.sub /\.html$/, ''

            javascript_file.write %Q{var #{fixture_name} = "}

            File.foreach html_filename do |line_of_html|
              javascript_file.write line_of_html.chomp.squish.gsub('"', '\\"')
            end

            javascript_file.write %Q{";\n\n}
          end
        end
      end
    end
  end
end