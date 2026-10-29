package com.antistress.relaxbutton;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private AppUpdateManager appUpdateManager;

    // Google Play in-app review. Play decides whether the card is shown (quota), and never says
    // whether the user rated, so "launched" only means the flow ran without an error.
    @PluginMethod
    public void requestReview(PluginCall call) {
        if (getActivity() == null) {
            JSObject result = new JSObject();
            result.put("launched", false);
            result.put("error", "No activity");
            call.resolve(result);
            return;
        }

        ReviewManager reviewManager = ReviewManagerFactory.create(getContext());
        reviewManager.requestReviewFlow().addOnCompleteListener(request -> {
            if (!request.isSuccessful()) {
                JSObject result = new JSObject();
                result.put("launched", false);
                Exception error = request.getException();
                result.put("error", error != null ? error.getMessage() : "Review flow unavailable");
                call.resolve(result);
                return;
            }

            reviewManager.launchReviewFlow(getActivity(), request.getResult())
                .addOnCompleteListener(flow -> {
                    JSObject result = new JSObject();
                    result.put("launched", flow.isSuccessful());
                    call.resolve(result);
                });
        });
    }

    @Override
    public void load() {
        appUpdateManager = AppUpdateManagerFactory.create(getContext());
    }

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        if (appUpdateManager == null) {
            appUpdateManager = AppUpdateManagerFactory.create(getContext());
        }

        appUpdateManager.getAppUpdateInfo()
            .addOnSuccessListener(info -> call.resolve(toResult(info)))
            .addOnFailureListener(error -> {
                JSObject result = new JSObject();
                result.put("available", false);
                result.put("error", error.getMessage());
                call.resolve(result);
            });
    }

    @PluginMethod
    public void openStoreListing(PluginCall call) {
        String packageName = getContext().getPackageName();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            getContext().startActivity(intent);
        } catch (ActivityNotFoundException error) {
            Intent fallback = new Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=" + packageName)
            );
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
        call.resolve();
    }

    private JSObject toResult(AppUpdateInfo info) {
        JSObject result = new JSObject();
        boolean available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE;
        result.put("available", available);
        result.put("availableVersionCode", info.availableVersionCode());
        result.put("priority", info.updatePriority());
        Integer stalenessDays = info.clientVersionStalenessDays();
        if (stalenessDays != null) result.put("stalenessDays", stalenessDays);
        return result;
    }
}
