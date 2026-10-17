package com.auroraos.desktop;

import androidx.core.content.FileProvider;

/** Own FileProvider subclass so it never clashes with Capacitor's provider declaration. */
public class AuroraFileProvider extends FileProvider { }
