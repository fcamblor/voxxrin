package vooxr.droid;

import android.os.Bundle;
import com.phonegap.DroidGap;
import voxxr.droid.R;
import android.os.Build;
import android.util.Log;
import android.content.pm.ApplicationInfo;
import android.webkit.WebView;

public class VoxxrDroid extends DroidGap {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){
          if(0 != (getApplicationInfo().flags = ApplicationInfo.FLAG_DEBUGGABLE)){
            Log.i("Your app", "Enabling web debugging");
            WebView.setWebContentsDebuggingEnabled(true);
          }
        }

        super.setIntegerProperty("splashscreen", R.drawable.splash);
        super.loadUrl("file:///android_asset/www/m.html");
    }
}

