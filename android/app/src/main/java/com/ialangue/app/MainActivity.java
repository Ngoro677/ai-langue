package com.ialangue.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.Manifest;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_RECORD_AUDIO = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewForAudio();
        requestAudioPermissionIfNeeded();
    }

    /** Autorise la lecture audio (Écouter) sans geste utilisateur dans le WebView. */
    private void configureWebViewForAudio() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;
        WebSettings settings = webView.getSettings();
        if (settings == null) return;
        settings.setMediaPlaybackRequiresUserGesture(false);
    }

    /** Demande RECORD_AUDIO au premier lancement pour le micro. */
    private void requestAudioPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, PERMISSION_REQUEST_RECORD_AUDIO);
        }
    }
}
