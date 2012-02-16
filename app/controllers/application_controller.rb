class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :ensure_domain

  APP_DOMAIN = 'www.yammerfall.com'

  def ensure_domain
    redirect_to "https://#{APP_DOMAIN}", :status => 301
  end
end
