#!/usr/bin/env node
var fs = require('fs');
var path = require('path');


var rootdir = process.argv[2];
// var projectdir = path.join("../../platforms/android/")
var projectdir = path.join(rootdir, "platforms/android/")
var widget_name = "SOSWidgetProvider"


// Declaring the plugin on Andrid Manifest
var declaration_file = `
    <receiver android:name="${widget_name}" >
        <intent-filter>
            <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        </intent-filter>
        <meta-data android:name="android.appwidget.provider"
                android:resource="@xml/appwidgetproviderinfo" />
    </receiver>
</application>`
var manifest = fs.readFileSync(projectdir + "AndroidManifest.xml", 'utf8');
if (manifest.lastIndexOf(widget_name) == -1) {
    manifest = manifest.replace("</application>", declaration_file);
    fs.writeFileSync(projectdir + "AndroidManifest.xml", manifest);
    console.log("Manifest Updated");
}


var has_img = true
var image_name = "soswidget"
if (has_img) {
    if (!fs.existsSync(projectdir + "res/drawable-nodpi")) {
        fs.mkdirSync(projectdir + "res/drawable-nodpi");
    }
    fs.createReadStream(rootdir + '/resources/' + image_name + '.png').pipe(fs.createWriteStream(projectdir + 'res/drawable-nodpi/' + image_name + '.png'));

}

// Adding the AppWidgetProviderInfo Metadata
var provider_info_file = `
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="86400000"
    ${has_img ? 'android:previewImage="@drawable/' + image_name + '"' : ''}
    android:initialLayout="@layout/sos_appwidget_info"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>
`
if (!fs.existsSync(projectdir + "res/xml")) {
  fs.mkdirSync(projectdir + "res/xml");
}
fs.writeFileSync(projectdir + "res/xml/appwidgetproviderinfo.xml", provider_info_file);
console.log("AppWidgetProviderInfo Created");



// Creating the App Widget Layout
var layout_file = `
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#12000000"
        android:orientation="vertical">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content">

            <ImageView
                android:id="@+id/icon"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:src="@mipmap/icon" />

            <TextView
                android:id="@+id/openView"
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:gravity="center_vertical"
                android:text="NEWTON TRACKER"
                android:textAlignment="center"
                android:textColor="@android:color/black"
                android:textSize="14sp"
                android:textStyle="bold" />
        </LinearLayout>

        <Button
            android:id="@+id/button2"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:layout_margin="8dp"
            android:layout_marginBottom="8dp"
            android:layout_marginEnd="8dp"
            android:layout_marginLeft="8dp"
            android:layout_marginRight="8dp"
            android:layout_marginStart="8dp"
            android:layout_marginTop="8dp"
            android:backgroundTint="@android:color/holo_red_dark"
            android:backgroundTintMode="src_over"
            android:text="S.O.S"
            android:textAlignment="gravity"
            android:textColor="@android:color/white"
            android:textSize="18sp"
            android:textStyle="bold" />

    </LinearLayout>

</RelativeLayout>
`
if (!fs.existsSync(projectdir + "res/layout")) {
  fs.mkdirSync(projectdir + "res/layout");
}

fs.writeFileSync(projectdir + "res/layout/sos_appwidget_info.xml", layout_file);
console.log("App Widget Xml Created")




// Creating the Class
var class_file = `
package com.seedgabo.newtonTracker;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
public class SOSWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
    
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if ("action".equals(intent.getAction())){
        }
    };

    void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.sos_appwidget_info);
        
        String url = "newtonTracker://sos";
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, 0);
        views.setOnClickPendingIntent(R.id.button2,pendingIntent);


        String url2 = "newtonTracker://";
        Intent intent2 = new Intent(Intent.ACTION_VIEW);
        intent2.setData(Uri.parse(url2));
        PendingIntent pendingIntent2 = PendingIntent.getActivity(context, 0, intent2, 0);
        views.setOnClickPendingIntent(R.id.openView,pendingIntent2);
        views.setOnClickPendingIntent(R.id.icon,pendingIntent2);
        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}`
fs.writeFileSync(projectdir + "src/com/seedgabo/newtonTracker/SOSWidgetProvider.java", class_file);
console.log("Class File Created")
