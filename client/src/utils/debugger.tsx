// Simple debugging utility for the Real Estate Auto-Posting App

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  data: any;
}

class AppDebugger {
  private isEnabled: boolean;
  private logs: LogEntry[];

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.logs = [];
  }

  log(message: string, type: string = 'info', data: any = null): void {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      type,
      message,
      data
    };

    this.logs.push(logEntry);
    
    // Console output with styling
    const style = this.getLogStyle(type);
    console.log(`%c[${timestamp}] ${type.toUpperCase()}: ${message}`, style);
    
    if (data) {
      console.log('Data:', data);
    }

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  private getLogStyle(type: string): string {
    const styles: Record<string, string> = {
      info: 'color: #3B82F6; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
      warning: 'color: #F59E0B; font-weight: bold;',
      success: 'color: #10B981; font-weight: bold;',
      debug: 'color: #6B7280; font-style: italic;'
    };
    return styles[type] || styles.info;
  }

  error(message: string, error: any = null): void {
    this.log(message, 'error', error);
  }

  warning(message: string, data: any = null): void {
    this.log(message, 'warning', data);
  }

  success(message: string, data: any = null): void {
    this.log(message, 'success', data);
  }

  debug(message: string, data: any = null): void {
    this.log(message, 'debug', data);
  }

  // Check common issues
  checkCommonIssues(): void {
    if (!this.isEnabled) return;

    this.log('🔍 Running diagnostic checks...', 'info');

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      this.warning('❌ No authentication token found');
    } else {
      this.success('✅ Authentication token present');
    }

    // Check if server is reachable
    this.checkServerHealth();

    // Check for common API endpoints
    this.checkAPIEndpoints();
  }

  async checkServerHealth(): Promise<void> {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        this.success('✅ Server is healthy');
      } else {
        this.error('❌ Server health check failed', { status: response.status });
      }
    } catch (error) {
      this.error('❌ Cannot reach server', error);
    }
  }

  async checkAPIEndpoints(): Promise<void> {
    const endpoints = [
      '/api/videos',
      '/api/analytics',
      '/api/platforms/status',
      '/api/autopost/cartoons'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        
        if (response.ok) {
          this.success(`✅ ${endpoint} is working`);
        } else if (response.status === 401) {
          this.warning(`🔐 ${endpoint} requires authentication`);
        } else {
          this.error(`❌ ${endpoint} returned ${response.status}`);
        }
      } catch (error) {
        this.error(`❌ ${endpoint} failed`, error);
      }
    }
  }

  // Get recent logs
  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    console.clear();
    this.log('🧹 Logs cleared', 'info');
  }

  // Export logs as JSON
  exportLogs(): void {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.success('📥 Debug logs exported');
  }

  // Add global error handler
  setupGlobalErrorHandler(): void {
    if (!this.isEnabled) return;

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('🚨 Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.error('🚨 Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    this.log('🛡️ Global error handlers setup', 'success');
  }
}

// Create singleton instance
const appDebugger = new AppDebugger();

// Setup global handlers
appDebugger.setupGlobalErrorHandler();

// Add to window for console access
if (process.env.NODE_ENV === 'development') {
  (window as any).appDebugger = appDebugger;
  console.log('🔧 App Debugger loaded! Use window.appDebugger to access debugging tools.');
  console.log('Available methods: checkCommonIssues(), getRecentLogs(), clearLogs(), exportLogs()');
}

export default appDebugger; 